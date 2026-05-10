---
title: 'The small UB launched by AVX'
description: 'I analyzed the reason why the program''s output differs depending on whether AVX is enabled.'
date: '2023-03-28T19:54:02+09:00'
tags: ['reverse-engineering', 'linux']
draft: false
lang: 'en'
translationType: 'machine'
featured: false
originalLang: 'ko'
canonicalTranslationOf: 'avx-broke-it-all'
---

## Before We Begin...
This post was actually drafted in late March 2023, but due to laziness it took about a year before I finally polished it up and uploaded it. So when I say "these days" in this post, I mean late March 2023.

## How It All Started
These days I'm learning C at school. I think because the professor finds it hard to differentiate students with just basic C syntax, he's been teaching a lot of murky material packed with Undefined Behaviour. One day he showed us the following code:

```c
printf("%f", 5 / 2);
```

He explained that since both sides of `5 / 2` are `int`, the result is the integer `2`, not the floating-point `2.5`, and that `printf` expects a `double` as its second argument because of the `%f` format specifier — so when an unexpected `int` is passed instead, `0.0` gets printed.

Hmm, on my computer it does print `0.0`...

![Result run on my computer](/images/avx-broke-it-all/Pasted%20image%2020240218015629.png)

But when run on my friend's computer, some weird garbage value is printed instead?

![Result run in the same environment as my friend's computer](/images/avx-broke-it-all/Pasted%20image%2020240218015835.png)


## Root Cause Analysis
To figure out what factor was causing the different output, I compared the differences between my setup and my friend's. The Ubuntu version and glibc version were identical. I was on x86-64 macOS, and my friend was running an x86-64 Ubuntu guest on an x86-64 Windows machine. To check whether the macOS vs Ubuntu difference was the cause, I installed an x86-64 Ubuntu guest via Parallels on x86-64 macOS and tested it — and sure enough, my environment still printed `0.0`. Wondering if it might be something specific to the VM, I installed VirtualBox (which my friend uses) and ran the same code — and as expected, a garbage value appeared. So I confirmed it was VM-dependent, but exactly which aspect of each VM was causing the different output?

## Disassembly
First, since the same binary produces different output depending on which VM runs it, it seemed difficult to trace the cause at the C language level. So I disassembled the binary, and the result is as follows:

```asm
; printf(".2f", 5/2)
mov    esi,0x2
lea    rax,[rip+0xea7]
mov    rdi,rax
mov    eax,0x0
call   0x1050 <printf@plt>
```

`5/2` was evaluated to `2` and then baked into the assembly as a constant. In line with the x86-64 calling convention, the first argument `"%.2f"` is passed in `rdi` via `lea rax, [rip+0xea7]` and `mov rdi, rax`, and the second argument `2` is passed in `rsi` via `mov esi, 0x2`. This code is too straightforward to be responsible for the differing output. Something must be happening inside `printf`.

## glibc Analysis
The `printf` function is implemented in glibc (since this was a freshly installed Ubuntu, it was definitely not something like musl libc). The implementation of `printf` is as follows:

```c
int __printf (const char *format, ...) {
    va_list arg;
    int done;

    va_start (arg, format);
    done = __vfprintf_internal (stdout, format, arg, 0);
    va_end (arg);

    return done;
}
```

It handles variadic arguments using `va_list`, `va_start`, and `va_end`. `printf` itself is just a wrapper; the actual logic lives in `__vfprintf_internal`. Its implementation is as follows:

```c
// ...

#if __HAVE_FLOAT128_UNLIKE_LDBL
    #define PARSE_FLOAT_VA_ARG_EXTENDED(INFO)                                       \
        do {                                                                        \
            if (is_long_double && (mode_flags & PRINTF_LDBL_USES_FLOAT128) != 0) {  \
                INFO.is_binary128 = 1;                                              \
                the_arg.pa_float128 = va_arg (ap, _Float128);                       \
            } else {                                                                \
                PARSE_FLOAT_VA_ARG (INFO);                                          \
            }                                                                       \
        } while (0)
#else
    #define PARSE_FLOAT_VA_ARG_EXTENDED(INFO)    PARSE_FLOAT_VA_ARG(INFO);
#endif

// ...

#define PARSE_FLOAT_VA_ARG(INFO)                                \
    do {                                                        \
        INFO.is_binary128 = 0;                                  \
        if (is_long_double)                                     \
            the_arg.pa_long_double = va_arg (ap, long double);  \
        else                                                    \
            the_arg.pa_double = va_arg (ap, double);            \
    }                                                           \
    while (0)

// ...

int vfprintf (FILE *s, const CHAR_T *format, va_list ap, unsigned int mode_flags) {
    LABEL (form_float):
    LABEL (form_floathex):
    {
        // ...
        PARSE_FLOAT_VA_ARG_EXTENDED (info);
        // ...
    }
}
```

The key part to notice is that when a value is passed with the `%f` format specifier, the argument is received by the `PARSE_FLOAT_VA_ARG_EXTENDED` macro. That macro checks whether the system supports `_Float128` — if it does, it reads the argument with `va_arg(ap, _Float128)`; otherwise it falls through to the `PARSE_FLOAT_VA_ARG(INFO)` macro. `PARSE_FLOAT_VA_ARG(INFO)` then further checks whether the argument is of type `long double` and executes either `va_arg(ap, long double)` or `va_arg(ap, double)` accordingly.

So that covers how `printf` processes its arguments. The cause of the differing output is probably somewhere in what we've found so far. My guess is that when an `int`-typed value is read as `double` via `va_arg`, each environment interprets the value differently. Before digging into how `va_arg` works, let's first check what happens if we properly pass `5.0/2.0` as the argument instead of `5/2`.

## Disassembly, Again
What happens when we pass a proper floating-point value to a `printf` with the `%f` format specifier? The disassembly looks like this:

```asm
mov    rax,QWORD PTR [rip+0xeb8]
movq   xmm0,rax
lea    rax,[rip+0xea4]
mov    rdi,rax
mov    eax,0x1
call   0x1050 <printf@plt>
```

The value is passed using an `xmm` register. The `xmm` registers were added in the SSE extension and are used for floating-point operations.

This gave me a clue. I formed a hypothesis that the output differs depending on which CPU extensions are enabled, and went ahead to verify it.

## Eureka
Below is the list of active CPU extensions on my computer.
![CPU extensions on my computer](/images/avx-broke-it-all/avx-broke-it-all/telegram-cloud-photo-size-5-6132179513400997680-y.jpg)

Below is the list of active CPU extensions in the same environment as my friend's computer.
![CPU extensions in the same environment as my friend's computer](/images/avx-broke-it-all/telegram-cloud-photo-size-5-6132179513400997681-x.jpg)

AVX is enabled on my computer, but disabled in the VirtualBox environment. So if I disable AVX in Parallels on x86-64 macOS, garbage values should be printed, right? Unfortunately I couldn't find a way to disable AVX in Parallels, but I did find a way to disable it via [kernel parameters](https://stackoverflow.com/questions/13965178/how-do-i-disable-avx-instructions-on-a-linux-computer), so I gave it a try.

Below is the result of running the problematic code in Parallels with AVX enabled.
![Result in Parallels with AVX enabled](/images/avx-broke-it-all/telegram-cloud-photo-size-5-6132179513400997687-y.jpg)

Below is the result of running the problematic code in Parallels with AVX disabled.
![Result in Parallels with AVX disabled](/images/avx-broke-it-all/telegram-cloud-photo-size-5-6132179513400997688-y.jpg)

Just as expected, AVX affected the output. But why does AVX affect the result?

## Googling
Since the same binary was run on both the AVX-enabled and AVX-disabled machines, I assumed it wasn't using any instructions introduced by AVX, so I Googled for instructions that behave differently when AVX is enabled. And I stumbled upon a bizarre instruction I'd never heard of before: [`CVTSS2SD`](https://modoocode.com/en/inst/cvtss2sd).

![CVTSS2SD](/images/avx-broke-it-all/Pasted%20image%2020240218024606.png)

When only SSE2 is enabled, it converts the single-precision floating-point value in the `xmm2` register to a double-precision floating-point value and stores it in `xmm1`. When AVX is enabled, it converts the single-precision floating-point value in the `xmm3` register to a double-precision floating-point value and stores it in `xmm2`, and then zero-fills the high bits.

## The Last Piece of the Puzzle
Looking at sections `6.5.2.2 Function calls` and `7.15.1 Variable argument list access macros` of the [C99 standard document](https://open-std.org/JTC1/SC22/WG14/www/docs/n1256.pdf), due to *default argument promotions*, a `float` passed as a variadic argument is always converted to `double`. Because simply widening a `float` from 32 bits to 64 bits without conversion would corrupt the value, the `CVTSS2SD` instruction is used to perform the type conversion — and since the behaviour of `CVTSS2SD` differs depending on whether AVX is enabled, different values are printed in different environments. In fact...


# 🚧 Work in Progress...
I'll finish this post soon!
