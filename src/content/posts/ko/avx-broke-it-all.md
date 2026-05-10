---
title: "AVX가 쏘아올린 작은 UB"
description: "AVX 활성화 여부로 프로그램의 출력이 달라지는 이유를 분석해봤습니다."
date: 2023-03-28T19:54:02+09:00
tags: ['reverse-engineering', 'linux']
draft: false
lang: ko
translationType: original
featured: false
---
## 시작하기 전에...
사실 이 글은 2023년 3월 말에 초안을 완성했는데, 게으름 이슈로 약 1년 가량이 지난 다음에서야 다듬어서 업로드 하게 됐어요. 그래서 이 글에서 지칭하는 '요즘'은 2023년 3월 말을 의미해요.

## 사건의 발단
요즘 학교에서 C언어를 배우고 있어요. 교수님께서 기초적인 C언어 문법만으로는 학생들을 변별하기 어려워서인지 Undefined Behaviour이 잔뜩 포함되어 아리까리한 내용을 많이 가르치시고 있어요. 하루는 교수님이 다음과 같은 코드를 보여주셨어요.

```c
printf("%f", 5 / 2);
```

교수님께서 5 / 2는 양쪽 모두 int형이기 때문에 연산 결과가 실수형 2.5가 아니라 정수형 2라고 하시면서 `printf`가 `%f` 형식 지정자때문에 두 번째 인자로 double형의 값이 오기를 기대했는데, 예기치 않은 int형의 값이 전달됐기 때문에 0.0이 출력된다고 하셨어요.

어라, 제 컴퓨터에서는 0.0이 출력되는데...

![내 컴퓨터에서 실행한 결과](/images/avx-broke-it-all/Pasted%20image%2020240218015629.png)

친구의 컴퓨터에서 실행했을 때는 이상한 쓰레기값이 출력되네요?

![친구의 컴퓨터와 똑같은 환경에서 실행한 결과](/images/avx-broke-it-all/Pasted%20image%2020240218015835.png)


## 원인 분석
어떠한 요인이 다른 출력 결과를 유발시키는지 확인하기 위해 제 환경과 친구 환경의 차이점을 비교해봤어요. 우분투 버전, glibc 버전 모두 동일했어요. 저는 x86-64 macOS를 사용하고 있었고, 친구는 x86-64 Windows 머신 위에 x86-64 Ubuntu 게스트를 설치해 사용하고 있었어요. macOS와 Ubuntu의 차이 때문인지 확인하기 위해 x86-64 macOS에서 Parallels로 x86-64 Ubuntu 게스트를 설치해 테스트했고, 마찬가지로 제 환경에서는 0.0이 출력됐어요. 혹시 가상머신의 특성을 타는건가 싶어 친구가 사용하는 VirtualBox를 설치해 위의 코드를 실행해봤고 예상했던대로 쓰레기값이 출력됐어요. 가상머신의 특성을 탄다는건 알게 됐는데, 정확히 각 가상머신의 어떤 요소가 다른 출력값을 야기했을까요?

## 디스어셈블
우선 동일한 바이너리를 다른 가상머신에서 실행했을 때 출력값이 달라지기 때문에 C언어 레벨에서는 원인을 추적하기 힘들어 보여요. 그래서 바이너리를 디스어셈블 해봤고, 결과는 다음과 같아요.

```asm
; printf(".2f", 5/2)
mov    esi,0x2
lea    rax,[rip+0xea7]
mov    rdi,rax
mov    eax,0x0
call   0x1050 <printf@plt>
```

5/2는 2로 evaluate된 다음 그 결과가 상수로 어셈블리에 기록되었네요. x86-64 calling convention에 맞게 첫 번째 인자인 "%.2f"를 `lea rax, [rip+0xea7]`과 `mov rdi, rax`로 rdi에 넘겨주고, 두 번째 인자인 2를 `mov esi, 0x2`로 rsi에 넘겨주네요. 이 코드는 너무 obvious하기 때문에 출력값이 달라지는데 영향을 안 줄 것 같아요. 아마 `printf`의 내부 동작에서 무언가 일어날 것 같아요.

## glibc 분석
`printf` 함수는 glibc에(설치 직후의 Ubuntu를 사용했기 때문에 musl libc같은건 확실히 아니었어요) 구현되어 있어요. 우선 `printf`의 구현은 다음과 같아요.

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

`va_list`, `va_start`, `va_end`를 이용해 가변 인자를 처리하네요. printf는 껍데기에 불과하고, 실질적인 로직은 `__vfprintf_internal`에 구현되어 있는걸로 보여요. `__vfprintf_internal`의 구현은 다음과 같아요.

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

주목해야 할 부분은 `%f` 형식지정자로 값을 넘겨줬을 때 인자를 `PARSE_FLOAT_VA_ARG_EXTENDED` 매크로로 받아요. `PARSE_FLOAT_VA_ARG_EXTENDED`매크로는 시스템이 `_Float128` 지원하는지 확인한 다음 지원한다면 `va_arg(ap, _Float128)`로 인자를 받아오고, 지원하지 않는다면 `PARSE_FLOAT_VA_ARG(INFO)` 매크로를 실행해요. `PARSE_FLOAT_VA_ARG(INFO)`는 또 다시 인자가 `long double`형인지 확인하여 `va_arg(ap, long double)` 또는 `va_arg(ap, double)`중 하나를 실행해요.

여기까지 `printf`가 인자를 어떻게 처리하는지 알아봤어요. 지금까지 알아낸 것 중에서 출력 결과를 다르게 하는 원인이 있을거에요. 아마 `va_arg`로 int 형의 값을 double형으로 읽었을 때 각 환경에서 값을 다르게 표현하는 것 같아요. 그러면 `va_arg`가 어떻게 작동하는지 알아보기 전에 인자로 `5/2`가 아니라 `5.0/2.0`이 제대로 전달되게 하면 어떤 일이 일어나는지 확인해볼까요?

## 다시 디스어셈블
`%f` 형식지정자로 포맷한 `printf`에 실수형 값을 제대로 입력하면 어떻게 될까요? 디스어셈블 결과는 다음과 같아요.
```asm
mov    rax,QWORD PTR [rip+0xeb8]
movq   xmm0,rax
lea    rax,[rip+0xea4]
mov    rdi,rax
mov    eax,0x1
call   0x1050 <printf@plt>
```

xmm 레지스터를 이용해 값을 전달하네요. xmm 레지스터는 SSE 확장에 추가된 레지스터로, 부동소수점 관련 연산을 처리하는데 사용돼요.

저는 여기에서 단서를 얻어 CPU에서 활성화된 확장에 따라 출력 결과가 달라진다는 가설을 세웠고, 진짜 그런지 확인해봤어요. 

## 유레카
아래는 제 컴퓨터에서 확인한 활성화된 CPU 확장 목록이에요.
![내 컴퓨터에서 확인한 CPU 확장](/images/avx-broke-it-all/avx-broke-it-all/telegram-cloud-photo-size-5-6132179513400997680-y.jpg)

아래는 친구의 컴퓨터와 같은 환경에서 확인한 활성화된 CPU 확장 목록이에요.
![친구의 컴퓨터와 똑같은 환경에서 확인한 CPU 확장](/images/avx-broke-it-all/telegram-cloud-photo-size-5-6132179513400997681-x.jpg)

제 컴퓨터에서는 AVX가 활성되어 있지만 VirtualBox상의 환경에서는 AVX가 비활성화 되어있는 것을 볼 수 있어요. 그러면 x86-64 macOS에 설치된 Parallels에서 AVX를 비활성화 시키면 쓰레기 값이 출력되겠죠? 아쉽게도 Parallels에서 AVX를 비활성화 시키는 방법은 찾지 못했고, 대신 [커널 파라미터](https://stackoverflow.com/questions/13965178/how-do-i-disable-avx-instructions-on-a-linux-computer)를 통해 AVX를 비활성화 시키는 방법을 발견해서 한번 시도해봤어요.

아래는 AVX가 활성화된 Parallels에서 문제의 코드를 실행한 결과예요.
![AVX가 활성화된 Parallels에서의 결과](/images/avx-broke-it-all/telegram-cloud-photo-size-5-6132179513400997687-y.jpg)

아래는 AVX가 비활성화된 Parallels에서 문제의 코드를 실행한 결과예요.
![AVX가 비활성화된 Parallels에서의 결과](/images/avx-broke-it-all/telegram-cloud-photo-size-5-6132179513400997688-y.jpg)
예상했던대로 AVX가 실행 결과에 영향을 줬어요. 그런데 왜 AVX가 실행 결과에 영향을 줄까요?

## 구글링
일단 똑같은 바이너리를 AVX가 활성화된 컴퓨터와 비활성화된 컴퓨터에서 모두 실행했기 때문에 AVX에서 추가된 인스트럭션을 사용하지 않았다고 추정하고, AVX가 활성화되었을 때 동작이 달라지는 인스트럭션에 대해 구글링했어요. 그리고 [`CVTSS2SD`](https://modoocode.com/en/inst/cvtss2sd)라는 듣도보도못한 괴상한 인스트럭션을 발견했어요.

![CVTSS2SD](/images/avx-broke-it-all/Pasted%20image%2020240218024606.png)

SSE2만 활성화 되었을 때에는 xmm2 레지스터의 단정밀도 부동소수점 값을 xmm1 레지스터에 배정밀도 부동소수점으로 변환하여 저장해요. 그리고 AVX가 활성화 되었을 때에는 xmm3 레지스터의 단정밀도 부동소수점 값을 xmm2 레지스터에 배정밀도 부동소수점으로 변환하여 저장하고, high bits를 0으로 채워요.

## 마지막 퍼즐 조각
[C99 표준 문서](https://open-std.org/JTC1/SC22/WG14/www/docs/n1256.pdf) `6.5.2.2 Function calls`와 `7.15.1 Variable argument list access macros`를 보면 `default argument promotions`에 의해 가변인자로 float형을 전달하면 무조건 double형으로 변환되게 되어있어요. 형 변환시 float형을 무작정 32비트에서 64비트로 크기만 키우면 값이 깨지기 때문에 CVTSS2SD라는 인스트럭션을 이용해 형변환을 하고, AVX에 활성화에 따라 CVTSS2SD 인스트럭션의 동작이 다르기 때문에 환경에 따라 다른 값이 출력되는걸로 보여요. 실제로...


# 🚧 작성 중...
빠른 시일 내로 글을 마무리하겠습니다!