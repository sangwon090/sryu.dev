---
title: "한컴타자연습 이스터에그 분석"
description: "한컴타자연습에 숨겨진 이스터에그를 띄우는 조건을 분석해봤습니다."
date: 2023-01-19T18:46:56+09:00
tags: ['reverse-engineering', 'windows']
lang: ko
translationType: original
draft: false
featured: false
commentsIssue: 1
---

고등학교 2학년 때 한컴타자연습 리소스에 이스터에그가 숨겨져 있다는 사실을 나무위키를 통해 알게 됐는데요,
이스터에그가 더미 데이터로만 존재하는지, 프로그램 상에서 이스터에그를 띄우는 방법이 있는지 궁금해서 리버싱 해봤었습니다.
프로그램 구조가 단순해서 이스터에그를 띄우는 키 조합을 쉽게 알아낼 수 있었고, 리버싱 결과를 페이스북의 
[코딩이랑 무관합니다만 그룹](https://www.facebook.com/groups/System.out.Coding/permalink/4095674740492190/)에 올렸습니다.

![페이스북 스크린샷](/images/hancom-typing-training-easter-egg/comu.png)

블로그를 개설하고 어떤 글을 올릴까 고민하다가, 한컴타자연습 리버싱 과정을 올리는게 좋을 것 같아서 한번 정리해봤습니다.
2년 전에 리버싱 과정을 기록해두지 않아서 이번에 리버싱을 다시 해봤는데, 재작년에 발견하지 못하고 넘어간 다른 키 조합도 발견했습니다.

## 시작하기 전에
이 글은 한컴타자연습 2005를 기준으로 작성되었습니다. 2002, 2004 버전도 비슷한 구조를 갖고 있을겁니다.
한컴타자연습 2007 버전부터는 이스터에그 관련 코드가 제거되었습니다.

앞에서 언급했듯 프로그램이 단순해서 리버싱을 제대로 공부한 적 없는 상태로도, IDA의 디컴파일러 기능만으로 이스터에그를 쉽게 찾을 수 있었습니다.
리버싱에 관심이 있으시다면 제 글을 읽기 전에 직접 분석해보는 것도 좋을 것 같습니다.

## 리소스 훑어보기
어떤 이스터에그 관련 리소스가 있는지 리소스해커로 한번 살펴보겠습니다.

1. 첫 번째 이스터에그 `169 (0xA9)` ![이스터에그 리소스 1](/images/hancom-typing-training-easter-egg/resource_hacker_01.png#center)
2. 두 번째 이스터에그 `346 (0x15A)` ![이스터에그 리소스 2](/images/hancom-typing-training-easter-egg/resource_hacker_02.png#center)

수능을 앞두고 개발했다는 부분이 인상적입니다.

## 이스터에그를 표시하는 코드

### LoadImageA
이스터에그 관련 부분만 빠르게 분석해봅시다. 이스터에그를 화면에 띄우려면 이미지를 불러오는 함수를 호출할 것입니다.
이미지를 로드하는 `LoadImageA` 함수의 크로스 레퍼런스를 한번 살펴봅시다.

![LoadImageA xref 목록](/images/hancom-typing-training-easter-egg/LoadImageA%20xref.png#center)

4개의 xref를 가지고 있습니다. 하나씩 확인해봅시다.

---

`sub_4069A0`의 디컴파일 결과입니다.

```c
HANDLE __cdecl sub_4069A0(LPCSTR name, _DWORD *a2)
{
    HANDLE result; // eax
    CHAR Text[256]; // [esp+8h] [ebp-100h] BYREF

    *a2 = 0;
    result = LoadImageA(hInst, name, 0, 0, 0, 0x10u);
    *a2 = result;
    if ( !result )
    {
        sprintf(Text, aS_0, name);
        return (HANDLE)MessageBoxA(0, Text, aLoad, 0);
    }
    return result;
}
```

`LoadImageA`의 5번째 인자로 `LR_LOADFROMFILE (0x10)`을 넘깁니다. `name` 으로 넘어온 이름을 가진 파일을 로드하고 리턴하는 함수로 보입니다.
이스터에그 관련 이미지는 파일이 아니라 리소스에서 불러오고, `sub_4096A0`의 xref가 `WinMain+22F`에 있는
`sub_4069A0(aHnctlogoSys, &dword_932120);`밖에 없는 것으로 봤을 때 로고를 로드하는 함수인 것으로 보입니다. 넘어가겠습니다. 

---

`sub_406A10`의 디컴파일 결과입니다.

```c
HANDLE __cdecl sub_406A10(LPCSTR name, _DWORD *a2)
{
    HANDLE result; // eax
    CHAR Text[256]; // [esp+8h] [ebp-100h] BYREF

    *a2 = 0;
    result = LoadImageA(hInst, name, 0, 0, 0, 0x2000u);
    *a2 = result;
    if ( !result )
    {
        sprintf(Text, aS_0, name);
        return (HANDLE)MessageBoxA(0, Text, aLoad, 0);
    }
    return result;
}
```

`sub_406910`과 거의 똑같습니다. 하지만, `LoadImageA`의 5번째 인자로 `LR_CREATEDIBSECTION (0x2000)`를 넘긴다는 점이 다릅니다.
xref가 172개나 됩니다. `LoadImageA`의 나머지 xref를 분석하고, 이스터에그와 연관이 없다고 보이면 그 때 다시 분석하겠습니다.

---

`WinMain+BA`의 디컴파일 결과입니다.

```c
v18.hIconSm = (HICON)LoadImageA(hInst, name, 1u, 16, 16, 0);
```

아이콘을 불러오는 코드입니다. 넘어갑니다. 

---

`WinMain+`의 디컴파일 결과입니다.

```c
v19.hIconSm = (HICON)LoadImageA(hInst, name, 1u, 16, 16, 0);
```

이것도 아이콘을 불러오는 코드입니다. `sub_406A10`로 되돌아가서 분석해봅시다.

### sub_406A10

![sub_406A10의 xref](/images/hancom-typing-training-easter-egg/sub_406A10%20xref.png#center)

xref가 172개나 돼서 막막했는데, 모두 `sub_41CF80`에서 호출되는걸로 봐서는 분석해야 할 양이 생각보다는 많지 않을 것 같습니다.

### sub_41CF80

```c
HANDLE sub_41CF80()
{
    sub_406A10((LPCSTR)0x14C, &dword_C278E4);
    sub_406A10((LPCSTR)0x75, &dword_C2796C);
    sub_406A10((LPCSTR)0xAF, &dword_C0E8C4);
    // ...
    sub_406A10((LPCSTR)0xA9, &dword_C29B40);
    sub_406A10((LPCSTR)0x15A, &dword_C278E0);
    // ...
    sub_406A10((LPCSTR)0x14B, &dword_9305F4);
    sub_406A10((LPCSTR)0x153, &dword_45B37C);
    return sub_406A10((LPCSTR)0x158, &dword_461E6C);
}
```

리소스해커로 확인했다시피 이스터에그의 리소스 id는 `169 (0xA9)`와 `346 (0x15A)`입니다.
리소스가 `sub_406A10` 함수로 로드되어 `dword_C29B40`과 `dword_C278E0`에 저장되는 것 같습니다.
이 주소에 접근하는 코드를 분석하면 이스터에그 발동 조건을 알아낼 수 있을 것입니다.

### dword_C29B40

![dword_C29B40의 xref](/images/hancom-typing-training-easter-egg/dword_C29B40%20xref.png#center)

첫 번째 xref는 방금 분석했던 함수이고, 두 번째 xref는 `sub_41D9D0`에 있는 `DeleteObject(dword_C29B40);`입니다.
세 번째, 네 번째 xref는 `sub_41F5D0`에 있고, 둘 다 이스터에그 이미지를 띄우는 부분으로 추정됩니다.

## 이스터에그를 발동시키는 로직
### sub_41F5D0 (1)

필요 없는 부분은 생략했습니다.

```c
v3 = GetAsyncKeyState;  // <-- v3을 주목해주세요.
while ( 1 )
{
    // ...
    if ( (int (*)())dword_A570EC != sub_41CC30 )
    {
        dword_A570EC = (int)sub_41CC30;
        sub_41CE50();
    }
    v4 = sub_41F340();  // <-- v4를 주목해주세요.
    String[0] = 0;
    sub_4097F0(-100, -100, 0, (wchar_t *)String, 0);
    if ( v4 == 8 && v3(17) && v3(16) )
        ++v41;
    if ( v41 <= 11 )
        goto LABEL_50;
    if ( v4 == 73 )
        ++v40;
    if ( v40 > 0 )
    {
        if ( v4 == 78 )
            ++v38;
        if ( v38 > 1 && v4 == 79 )
            ++v39;
    }
    if ( v39 <= 0 )
        goto LABEL_50;
    if ( v39 >= 10 )
    {
        if ( v4 == 8 )
        {
            if ( !v3(17) || !v3(16) )
                goto LABEL_50;
            sub_406910(dword_C278E0, 100, 100);     // <-- 두 번째 이스터에그 표시
            while ( (sub_41F340() & 0x80000000) != 0 );
        }
        else
        {
            if ( v4 != 65 || !v3(83) || !v3(69) || !v3(32) || !v3(16) || v3(17) )
                goto LABEL_50;
            sub_406910(dword_C278E0, 100, 100);     // <-- 두 번째 이스터에그 표시
            while ( (sub_41F340() & 0x80000000) != 0 );
        }
        dword_A570EC = (int)sub_40E030;
        sub_41CE50();
        dword_45B36C = 1;
    }
    else
    {
        if ( v4 == 8 )
        {
            if ( !v3(17) || !v3(16) )
                goto LABEL_50;
            sub_406910(dword_C29B40, 100, 100);     // <-- 첫 번째 이스터에그 표시
            while ( (sub_41F340() & 0x80000000) != 0 );
        }
        else
        {
            if ( v4 != 65 || !v3(83) || !v3(69) || !v3(32) || !v3(16) || v3(17) )
                goto LABEL_50;
            sub_406910(dword_C29B40, 100, 100);     // <-- 첫 번째 이스터에그 표시
            while ( (sub_41F340() & 0x80000000) != 0 );
        }
        dword_A570EC = (int)sub_40E030;
        sub_41CE50();
    }
    LABEL_50:
    // ...
}
```

복잡해보이지만 차근차근 분석해보겠습니다. 우선, 이스터에그 발동 조건이 충족되지 않으면 `goto LABEL_50;`으로 키 조합을 검사하는 코드를 건너뛰는 것으로 보입니다.
`sub_406910(dword_C29B40, 100, 100);`가 이스터에그를 표시하는 함수로 보이는데, 어떤 조건일 때 호출되는지 확인해보겠습니다.

```c
if ( v39 >= 10 )
    // 두 번째 이스터에그
else
    if(v4 == 8)
        if(!v3(17) || !v3(16))
            goto LABEL_50;
            sub_406910(dword_C29B40, 100, 100);
    else
        if (v4 != 65 || !v3(83) || !v3(69) || !v3(32) || !v3(16) || v3(17))
            goto LABEL_50;
            sub_406910(dword_C29B40, 100, 100);
```

`v3`, `v4`가 무엇인지 알아내야 할 것 같습니다. 

```c
v3 = GetAsyncKeyState;
```

`v3`은 GetAsyncKeyState를 가리킵니다.
[MSDN의 GetAsyncKeyState 문서](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getasynckeystate)에
따르면, 함수가 호출된 시점에 인자로 받은 가상 키 코드에 해당하는 키가 눌려있으면 적절한 값을 리턴한다고 합니다.
가상 키 코드에 대한 정보는 [MSDN의 Virtual-Key Codes 문서](https://learn.microsoft.com/en-us/windows/win32/inputdev/virtual-key-codes)를
참고하시면 됩니다.

---

```c
v4 = sub_41F340();
```

`v4`는 `sub_41F340` 함수의 리턴값을 저장합니다. 자세히 분석해보겠습니다.

### sub_41F340

```c
WPARAM sub_41F340()
{
    // ...
    while ( 1 )
    {
        // ...
        if ( message == 256 )
        {
            v1 = sub_409550(Msg.wParam) == 0;
            result = Msg.wParam;
            if ( v1 )
            {
                switch ( Msg.wParam )
                {
                    case 8u:
                    case 9u:
                    case 0xDu:
                    case 0x15u:
                    case 0x1Bu:
                    case 0x21u:
                    case 0x22u:
                    case 0x25u:
                    case 0x26u:
                    case 0x27u:
                    case 0x28u:
                    case 0x2Eu:
                        return result;
                    default:
                        goto LABEL_14;
                }
            }
            return result;
        }
    LABEL_14:
        // ...
    }
    // ...
    return -2;
}
```

메시지 코드가 `WM_KEYDOWN (256)`일 때 wParam을 통해 어떤 키가 눌렸는지 알아냅니다.
키 코드가 `VK_BACK(8)`, `VK_TAB(9)`, `VK_ENTER(0xD)`, `VK_HANGUL(0x15)`, `VK_ESCAPE(0x1B)`, `VK_PRIOR(0x21)`,
`VK_NEXT(0x22)`, `VK_LEFT(0x25)`, `VK_UP(0x26)`, `VK_RIGHT(0x27)`, `VK_DOWN(0x28)`, `VK_DELETE(0x2E)` 중 하나라면
그 키 코드를 리턴합니다.

### sub_41F5D0 (2)

`v39`가 무엇인지 확인해보겠습니다.

```c
if ( v4 == 8 && v3(17) && v3(16) )
    ++v41;
if ( v41 <= 11 )
    goto LABEL_50;
if ( v4 == 73 )
    ++v40;
if ( v40 > 0 )
    if ( v4 == 78 )
        ++v38;
    if ( v38 > 1 && v4 == 79 )
        ++v39;
if ( v39 <= 0 )
        goto LABEL_50;
```

v3과 v4가 무엇인지 이미 분석을 해놨기 때문에 어떤 로직인지 간단하게 파악할 수 있을 것 같습니다. 위에서부터 하나씩 분석해보겠습니다.

1. `VK_CONTROL(17)`과 `VK_SHIFT(16)`이 눌려있는 상태로 `VK_BACK(8)`을 누르면 v41 값이 1만큼 증가합니다.

2. v41이 11 이하라면 `goto LABEL_50;`을 통해 키 조합을 확인하는 로직을 벗어납니다.
즉, Control키와 Shift키를 누른 상태에서 Backspace를 12번 이상 눌러야 나머지 코드가 실행됩니다.

3. `I(73)`를 누르면 v40 값이 1 증가합니다.

4. v40가 0을 초과하는 상태에서, 다시 말해 I를 1회 이상 누른 상태에서 `N(78)`을 누르면 v38의 값이 1만큼 증가합니다.

5. v38이 1을 초과하는 상태에서, 다시 말해 N을 2회 이상 누른 상태에서 `O(79)`를 누르면 v39의 값이 1 증가합니다.

여기까지가 두 이스터에그 모두 공통적으로 해당하는 키 조합입니다. 정리하자면 Ctrl + Shift를 누른 상태에서 Backspace를 12번 이상
누르고, I 1번 이상, N 2번 이상, O 1번 이상 눌러야합니다. 그런데 INNO가 무슨 의미일까요? 이스터에그에 나오는 개발자의
이메일 주소가 `innoboy@nownuri.net`인 것으로 보아 개발자가 사용하는 이메일 주소에서 따온 것 같습니다.

아무튼, 첫 번째 이스터에그를 표시하는 로직을 다시 확인해보겠습니다.

```c
if ( v39 >= 10 )
    // 두 번째 이스터에그
else
    if(v4 == 8)
        if(!v3(17) || !v3(16))
            goto LABEL_50;
        sub_406910(dword_C29B40, 100, 100);
    else
        if (v4 != 65 || !v3(83) || !v3(69) || !v3(32) || !v3(16) || v3(17))
            goto LABEL_50;
        sub_406910(dword_C29B40, 100, 100);
```

이스터에그가 발동되기 위해서는 v39가 10 미만이어야 하며, `v4 == 8`이고 `!v3(17) || !v3(16)`이어야 합니다.
쉽게 설명하자면, O가 10번 미만 눌리고 Control과 Shift가 눌려있는 상태에서 Backspace 키를 눌러야 이스터에그가 발동됩니다.

`v4 == 8`가 아닐 때 발동되는 코드도 보겠습니다. if문 안의 조건이 참일 때 `goto LABEL_50;`을 해버리므로 조건에 NOT을 씌워 봐야합니다.
`v4 == 65 && v3(83) && v3(69) && v3(32) && v3(16) && !v3(17)` 일 때 이스터에그가 발생됩니다.
다시 말해, S, E, SPACE, SHIFT가 눌렸고 Control이 눌리지 않은 상태에서 A를 누르면 이스터에그가 발생됩니다.
이 로직은 이번에 리버싱을 다시 새로 발견했습니다.

두 번째 이스터에그를 표시하는 로직을 보겠습니다.

```c
if ( v39 >= 10 )
    if ( v4 == 8 )
        if ( !v3(17) || !v3(16) )
            goto LABEL_50;
        sub_406910(dword_C278E0, 100, 100);
    else
        if ( v4 != 65 || !v3(83) || !v3(69) || !v3(32) || !v3(16) || v3(17) )
            goto LABEL_50;
        sub_406910(dword_C278E0, 100, 100);
```

나머지는 다 똑같은데 v39가 10 이상이어야 합니다. 즉, O를 10번 이상 눌러야 됩니다.

### 결론
이스터에그를 띄우기 위한 키 조합은 다음과 같습니다.

1. Control + Shift를 누른 상태에서 Backspace를 12번 이상 누릅니다.
2. I를 한 번 이상 누릅니다.
3. N을 두 번 이상 누릅니다.
4. O를 누릅니다. 10번 미만 누르면 첫 번째 이스터에그가, 10번 이상 누르면 두 번째 이스터에그가 표시됩니다.
5. Ctrl + Shift를 누른 상태에서 Backspace를 누르거나, S + E + Shift + Space를 누르고 Control을 누르지 않은 상태에서 A를 누릅니다.

## 리버싱을 마치며
사실 제가 글 쓰는 것을 잘 못합니다. 머릿속에 있는 생각을 글로 옮기면 두서 없고 일기 힘든 문장이 나옵니다.
한 번 쓴 단어나 표현을 계속 반복해서 쓰는 습관도 있습니다. 이 글이 블로그에 올라가는 첫 글일텐데, 사실 쓰다가 도저히
안되겠다 싶어서 갖다 버린 글도 몇 개 있고, 이 글도 처음 작성할 때 일주일 정도 붙들었습니다.

궁금하거나 수정이 필요해 보이는 부분은 댓글로 알려주시면 감사하겠습니다.