# INPLOT Design System

**서비스:** INPLOT\
**문서명:** Design System\
**목적:** 인플롯(INPLOT)의 일관된 브랜드 경험과 UI/UX를 구현하기 위한
디자인 시스템. 색상, 타이포그래피, 간격, 레이아웃, 컴포넌트 및 인터랙션
상태의 공통 기준을 정의한다.
------------------------------------------------------------------------

## 0. Design Principles

1.  담담하고 비판단적인 톤을 유지한다.
2.  정보의 우선순위가 명확하게 드러나는 단순한 시각 위계를 사용한다.
3.  장식보다 정보 전달과 사용성을 우선한다.
4.  색상, 타이포그래피, 간격, radius는 정의된 공통 규칙을 사용한다.
5.  동일한 역할의 컴포넌트는 화면이 달라도 동일한 시각 규칙과 상태표현을
    사용한다.
6.  기본 UI는 Flat Design을 지향하며 불필요한 gradient와 shadow를
    사용하지 않는다.
7.  Mobile-first, Light Mode를 기본으로 한다.

------------------------------------------------------------------------

# 1. Foundation

## 1.1 Color

### Core / Semantic

  ----------------------------------------------------------------------
  Token                                         Value Usage
  -------------------------- ------------------------ ------------------
  `color/action/primary`                    `#26314B` Primary CTA, 주요
                                                      활성 상태

  `color/action/secondary`                  `#476B9E` 링크, 보조
                                                      상호작용

  `color/text/primary`                      `#000000` 주요 본문/제목

  `color/text/secondary`                    `#8B93A5` 보조 정보

  `color/text/tertiary`                     `#B9C0CC` placeholder,
                                                      비활성/최소 정보에
                                                      제한적으로 사용

  `color/text/inverse`                      `#FFFFFF` 어두운 배경 위
                                                      텍스트

  `color/surface/default`                   `#FFFFFF` 기본 화면/컴포넌트
                                                      배경

  `color/surface/neutral`                   `#F5F7FB` 중립적 입력/섹션
                                                      배경 후보

  `color/surface/light`                     `#EEF2FA` Avatar 등 밝은
                                                      강조 배경

  `color/border/default`                    `#E9ECF2` 기본 border

  `color/border/light`                      `#F1F3F7` GNB,
                                                      Agreement/Search
                                                      계열

  `color/border/subtle`                     `#DFE3EA` Checkbox 등 미세
                                                      border

  `color/status/error`                      `#D12921` Error text/border

  `color/status/error-bg`                   `#FDEEF2` Error/alert 배경이
                                                      필요한 경우
  ----------------------------------------------------------------------

### Color rules

-   Primary color는 `#26314B`를 사용한다.
-   Secondary/Link color는 `#476B9E`를 사용한다.
-   Avatar는 `#EEF2FA` 단일색을 유지한다. 종목별 색상 variant는 만들지
    않는다.
-   `#B9C0CC`는 핵심 정보/본문에는 사용하지 않는다. placeholder,
    disabled, 저우선순위 정보에만 사용한다.
-   Trade Type Toggle은 매수/매도 의미색을 사용하지 않고 중립적인
    회색/화이트 계열로 표현한다.
-   매수/매도 의미색은 Badge처럼 정보 분류를 위한 작은 라벨에서만 연한
    tint로 사용한다.
-   Dark Mode palette는 이번 범위에서 정의하지 않는다.

------------------------------------------------------------------------

## 1.2 Typography

**Font Family:** Pretendard\
**Weights:** 400 / 600 / 700

  Role          Size   Weight   Line Height Primary Usage
  ----------- ------ -------- ------------- ----------------------
  Display       32px      700          38px 주요 통계 수치
  Heading L     26px      700          31px 페이지 제목
  Heading M     20px      600          24px 섹션 제목
  Heading S     16px      600          19px 소제목
  Body L        14px      600          17px 강조 본문, CTA label
  Body          13px      400          16px 기본 본문
  Body S        11px      400          13px 보조 정보
  Caption       10px      400          12px 날짜, 극소 정보

**Letter spacing:** 기본 `-0.3px`

### Typography rules

-   Font Weight는 400 / 600 / 700을 사용한다.
-   모든 텍스트를 하나의 line-height 배율로 강제하지 않는다. 위 type
    role별 값을 유지한다.
-   9px Label은 기본 시스템에서 제외한다. 화면에 반드시 필요한 예외가
    확인될 때만 사용한다.
-   10--11px 텍스트는 핵심 정보나 긴 문장에 사용하지 않는다.

------------------------------------------------------------------------

## 1.3 Spacing

### Base scale

  Token           Value
  ------------- -------
  `space/2xs`       4px
  `space/xs`        8px
  `space/sm`       12px
  `space/md`       16px
  `space/lg`       24px
  `space/xl`       32px

### Usage

-   Icon ↔ Text: 기본 8px
-   Label ↔ Input: 8px
-   Input ↔ Error Message: 4px
-   Form field ↔ Form field: 12px
-   일반 콘텐츠 그룹: 16px
-   Section 간: 24--32px
-   Page horizontal padding: 16px

### Exceptions

아래 값은 컴포넌트 전용 spacing으로 사용한다.

-   GNB item gap: **6px**
-   GNB 내부 icon ↔ label gap: **6px**
-   GNB의 6px 예외는 위 두 spacing에만 적용한다. 그 외 일반 Icon ↔ Text
    간격은 기본 8px을 사용한다.
-   Toggle container padding: **4px**
-   Numeric Keypad gap: **6px**

------------------------------------------------------------------------

## 1.4 Border Radius

  Usage                              Value
  ----------------------------- ----------
  Small / control                      4px
  Standard control                     8px
  Primary Button                  **10px**
  Trade Type Toggle container     **10px**
  GNB                                 12px
  Card                                14px
  Circle                               50%

### Radius rules

-   10px을 8px로 강제 통합하지 않는다.
-   10px radius는 **Primary Button과 Trade Type Toggle container에만**
    적용한다. 그 외 일반 control은 별도 컴포넌트 정의가 없는 경우
    Standard control 8px을 사용한다.
-   Circle은 정사각형 요소에만 `50%`를 사용한다.
-   Pill이 필요해질 경우 `9999px` 등 별도 full-pill token을 사용하고
    `50%`를 직사각형 pill에 사용하지 않는다.

------------------------------------------------------------------------

## 1.5 Border & Shadow

### Border

-   Default: `1px solid #E9ECF2`
-   Light: `1px solid #F1F3F7`
-   Subtle: `1px solid #DFE3EA`
-   Error: `1px solid #D12921`

### Shadow

기본 UI는 shadow를 사용하지 않는다.

예외: - Toast: `0 2px 10px rgba(0,0,0,0.08)`

------------------------------------------------------------------------

# 2. Layout

## 2.1 Viewport

-   기준 viewport: **360px**
-   Page horizontal padding: **16px**
-   360px viewport에서 좌우 padding 16px을 제외한 최대 콘텐츠 가용 폭은
    **328px**이다.
-   주요 full-width component는 `width: 100%`를 사용해 콘텐츠 가용 폭을
    따른다.
-   컴포넌트 규격에 표기된 `320px`은 대표 시안의 기준값이며, 구현 시
    고정 width를 의미하지 않는다.

## 2.2 General layout

-   Form field gap: 12px
-   Section gap: 24px 기본, 강한 구분이 필요하면 32px
-   Card 내부 gap: 12--16px
-   Card padding: 화면 맥락에 따라 20--24px 범위에서 사용
-   GNB: 하단 고정, 정의된 크기와 구조를 사용

------------------------------------------------------------------------

# 3. Components

## 3.1 Back Button

### Default

``` css
visual-size: 34px × 34px;
border: 1px solid #E9ECF2;
border-radius: 8px;
background: transparent;
icon: 16px / #8B93A5;
```

### Interaction

-   시각적 크기는 **34×34px**
-   실제 클릭/터치 영역은 **최소 44×44px 확보**
-   Hover: `background: #F5F7FB`
-   Active: `background: #E9ECF2`
-   Focus-visible: `outline: 2px solid #476B9E; outline-offset: 2px`
-   Disabled 상태는 실제 기능에서 필요한 경우에만 사용하며
    `opacity: .4`, interaction 제거

**Rule:** 44×44px 버튼으로 시각 크기 자체를 키우지 않는다.

------------------------------------------------------------------------

## 3.2 Primary Button

### Default

``` css
width: 320px;
height: 47px;
background: #26314B;
border: none;
border-radius: 10px;
font: Pretendard 14px / 600 / 17px;
color: #FFFFFF;
```

### States

-   Default: `#26314B`
-   Hover: `#1F2940`
-   Active/Pressed: `#182136`
-   Focus-visible: `outline: 2px solid #476B9E; outline-offset: 2px`
-   Disabled:
    -   background `#A6A6A6`
    -   text `#D9D9D9`

**Rule:** Hover/Active는 새로운 브랜드 컬러가 아니라 Primary의
interaction shade로만 사용한다.

------------------------------------------------------------------------

## 3.3 Input Field

컴포넌트 CSS에서 확정된 공통 Input 스타일이 없으므로, 아래를 **공통
규칙**로 사용한다.

### Default

``` css
width: 320px;
height: 44px;
padding: 0 12px;
background: #FFFFFF;
border: 1px solid #E9ECF2;
border-radius: 8px;
font: Pretendard 13px / 400 / 16px;
color: #000000;
```

Placeholder:

``` css
color: #B9C0CC;
```

### States

-   Default: white background + default border
-   Focus: `border-color: #476B9E`
-   Focus-visible: `box-shadow: 0 0 0 3px rgba(71,107,158,.12)`
-   Disabled: `background: #F5F7FB; color: #B9C0CC`
-   Error:
    -   border `#D12921`
    -   background `#FFFFFF`
    -   error message `11px / 400 / #D12921`
    -   error message gap `4px`

### Why this baseline

-   Input 자체를 Error 배경색으로 채우는 것보다 border + message로
    상태를 표현해 화면이 과하게 붉어지는 것을 피한다.
-   `#FDEEF2`는 inline alert/banner 등 별도 error surface가 필요한
    경우에만 사용하며, **Input background에는 사용하지 않는다.**

------------------------------------------------------------------------

## 3.4 GNB

아래 규격을 사용한다.

``` css
width: 340px;
height: 62px;
background: #FFFFFF;
border: 1px solid #F1F3F7;
border-radius: 12px;
padding: 12px 8px;
gap: 6px;
```

-   6px gap은 **GNB item gap과 GNB 내부 icon ↔ label gap에만 적용하는
    예외값**이다.
-   그 외 일반 Icon ↔ Text 간격은 기본 8px을 사용한다.
-   Active/Inactive 상태는 동일한 GNB 규칙 안에서 일관되게 표현한다.

------------------------------------------------------------------------

## 3.5 Trade Type Toggle

거래 유형을 선택하는 segmented control이다.\
**매수/매도에 빨강·파랑 의미색을 사용하지 않는다.** 선택 여부만 중립적인
명도 차이로 표현한다.

### Container

``` css
width: 320px;
height: 44px;
background: #F1F3F7;
border-radius: 10px;
padding: 4px;
display: flex;
gap: 0;
```

### Segment

``` css
height: 36px;
border-radius: 8px;
border: none;
font: Pretendard 13px / 400 / 16px;
```

### States

**Inactive**

``` css
background: transparent;
color: #8B93A5;
font-weight: 400;
```

**Selected**

``` css
background: #FFFFFF;
color: #26314B;
font-weight: 600;
```

**Disabled**

``` css
color: #B9C0CC;
opacity: 0.6;
```

-   Container radius: 10px
-   Segment radius: 8px
-   매수/매도 여부에 따른 빨강·파랑 배경색은 사용하지 않는다.
-   Selected 상태는 모든 옵션에서 동일한 neutral style을 사용한다.

------------------------------------------------------------------------

## 3.6 Badge - Trade Type

매수/매도 유형을 정보성 라벨로 표시하는 Badge다.\
Toggle과 달리 직접 선택하는 컨트롤이 아니므로, 의미 구분을 위해 **연한
색상 tint**를 사용할 수 있다.

### Base

``` css
height: 24px;
padding: 0 10px;
border-radius: 9999px;
font: Pretendard 11px / 600 / 13px;
display: inline-flex;
align-items: center;
justify-content: center;
```

### Variants

**매수 계획 / Buy**

``` css
background: #EEF4FD;
color: #476B9E;
```

**매도 계획 / Sell**

``` css
background: #FDEEF2;
color: #C75A6A;
```

### Rules

-   Badge는 정보 분류용으로만 사용한다.
-   배경은 채도가 낮은 연한 tint를 사용한다.
-   강한 원색 또는 Primary Button 수준의 진한 배경을 사용하지 않는다.
-   동일한 매수/매도 색을 Toggle 선택 상태에 적용하지 않는다.
-   Badge 문구는 `매수 계획`, `매도 계획`처럼 의미가 텍스트로도
    구분되도록 한다.

------------------------------------------------------------------------

## 3.7 Numeric Keypad

기본 규칙:

``` css
width: 320px;
height: 212px;
grid: 3 columns × 4 rows;
gap: 6px;
```

Key:

``` css
height: 47px;
background: #F7F8FA;
border-radius: 8px;
font-size: 16px;
color: #253247;
```

-   Numeric Keypad gap은 6px을 사용한다.
-   대표 거래기록 화면에서 레이아웃이 깨지거나 원본과 명확히 다를 때만
    수정한다.

------------------------------------------------------------------------

## 3.8 Agreement Checkbox Row

아래 규격을 사용한다.

-   Row border: `#F1F3F7`
-   Checkbox: 18×18px
-   Checkbox radius: 5px
-   Checked background: `#26314B`
-   Label: 13px / 400
-   Optional link: 12px / 400

------------------------------------------------------------------------

## 3.9 Search Result Row

-   Height: 67px
-   Border: `#F1F3F7`
-   Name: 14px / 600
-   Ticker/Market: 12px / 400

------------------------------------------------------------------------

## 3.10 Trade Record Row / Avatar

아래 구조를 사용한다.

Avatar:

``` css
width: 32px;
height: 32px;
border-radius: 50%;
background: #EEF2FA;
```

-   Avatar는 **단일색 사용**
-   종목별 color variant를 추가하지 않는다.
-   Avatar initial weight 700 유지

Trade Record Row의 spacing/typography도 우선 유지하고, 홈 대표 화면에서
전체 밀도만 확인한다.

------------------------------------------------------------------------

## 3.11 Toast

아래 규격을 사용한다.

``` css
background: #FFFFFF;
border: 1px solid #E9ECF2;
border-radius: 10px;
box-shadow: 0 2px 10px rgba(0,0,0,.08);
```

-   상태는 icon + title/message로 구분한다.
-   Error라고 해서 Toast 전체 배경을 빨간색으로 채우지 않는다.
-   Error icon 또는 의미 요소에 `#D12921`을 사용한다.

------------------------------------------------------------------------

# 4. Data Visualization / Chart

인사이트 화면의 차트는 다른 UI와 동일하게 **담담하고 정돈된 톤**을
유지한다.

차트의 종류나 구현 방식과 관계없이 색상, 타이포그래피, 여백, 범례, 선
굵기 등 시각 규칙을 아래 기준으로 통일한다.

**Chart-only visual values:** 이 섹션에서 별도로 정의한 색상(`#191F28`,
`#8594A9`, `#EAEDF0`, `#EDF0F5`, `#C99A3D` 등)은 Data Visualization
전용값으로 사용하며, 일반 UI의 Foundation color token을 대체하지 않는다.

------------------------------------------------------------------------

## 4.1 Chart Card

차트는 독립된 Card 안에 배치한다.

-   Background: `#FFFFFF`
-   Border: `1px solid #EAEDF0`
-   Border radius: `16px`
-   Horizontal margin: `20px`
-   내부 좌우 padding: `16px`
-   Shadow: 사용하지 않음
-   Card 높이는 콘텐츠 양에 따라 조정 가능
-   같은 화면의 Chart Card는 좌우 정렬선을 맞춘다.
-   **Chart Card의 16px radius는 일반 Card 14px과 구분되는 Data
    Visualization 전용 예외값이다.**

------------------------------------------------------------------------

## 4.2 Chart Typography

-   Chart title: `12px / 700 / 17px`
-   Group title: `11px / 700 / 16px`
-   Legend label: `10--11px / 400`
-   Axis / Tick / Count / Percentage: `10px / 400` 이상
-   Primary chart text: `#191F28`
-   Secondary chart text: `#8594A9`

**Rule:** 공간을 맞추기 위해 텍스트를 10px 미만으로 축소하지 않는다.

정보가 많을 경우 font-size를 줄이는 대신 차트 크기, Legend 배치,
줄바꿈을 조정한다.

------------------------------------------------------------------------

## 4.3 Line Chart

시간에 따른 변화나 두 Series의 추이를 비교할 때 사용한다.

### Series

-   Buy / 매수: `#476B9E`
-   Sell / 매도: `#C99A3D`
-   Line width: `2px`
-   Point marker: `6px circle`
-   Point는 해당 Line과 동일한 색상을 사용한다.

### Grid / Axis

-   Horizontal grid: `#EDF0F5 / 1px`
-   Axis / Tick label: `#8594A9`
-   Vertical grid: 사용하지 않음
-   Area fill: 사용하지 않음
-   Chart 자체에 별도 Border 또는 Shadow를 추가하지 않는다.

### Legend

-   Marker: `8 × 8px circle`
-   Marker ↔ Label gap: `6px`
-   Chart 상단, Title 아래에 배치
-   매수 → 매도 순서를 유지한다.

------------------------------------------------------------------------

## 4.4 Progress Bar

계획 이행 현황이나 TOP 3처럼 상대적인 크기를 비교할 때 사용한다.

-   Height: `8px`
-   Border radius: `4px`
-   Track: `#E0E6F5`
-   Default fill: `#5A667A`
-   Strong emphasis fill: `#252F4A`
-   Label은 Bar 위에 배치
-   Label ↔ Bar gap: `4--6px`
-   Bar group gap: `12--16px`
-   Gradient / Shadow / Outline: 사용하지 않음

------------------------------------------------------------------------

## 4.5 Pie Chart

전체에서 각 Category가 차지하는 비중을 보여줄 때 사용한다.

### Size

-   Overview Pie: `120 × 120px`
-   Detail Pie: `56 × 56px`
-   Buy / Sell 상태 Pie: `64 × 64px`

### Style

-   Slice separator: `1px solid #FFFFFF`
-   Pie 내부에는 Category text를 직접 넣지 않는다.
-   Category 정보는 Legend로 제공한다.
-   같은 수준의 Pie Chart는 동일한 크기를 유지한다.

### Category Palette

일반 Category Chart는 아래 색상을 진한 순서부터 사용한다.

  Order   Color
  ------- -----------
  1       `#252F4A`
  2       `#476B9E`
  3       `#738CAD`
  4       `#A6B8D1`
  5       `#D9E3F0`
  6       `#EEF2FA`

-   비중이 큰 항목부터 진한 색을 우선 배정한다.
-   임의의 Rainbow Palette를 사용하지 않는다.
-   Category가 많아져도 서로 무관한 강한 색을 추가하지 않는다.

------------------------------------------------------------------------

## 4.6 Buy / Sell Chart Palette

매수·매도 데이터를 별도의 Pie Chart 또는 Series로 표현할 때 아래
Palette를 사용한다.

### Buy

  Order   Color
  ------- -----------
  1       `#476B9E`
  2       `#6382AD`
  3       `#8098BC`
  4       `#9CAFCB`
  5       `#B8C5DA`
  6       `#D4DCE8`
  7       `#F0F2F7`

### Sell

  Order   Color
  ------- -----------
  1       `#C99A3D`
  2       `#D5AE60`
  3       `#DFC382`
  4       `#E9D6A6`
  5       `#F3E9CC`

-   Buy는 Blue 계열, Sell은 Muted Gold 계열을 유지한다.
-   가장 비중이 큰 항목부터 진한 색을 우선 사용한다.
-   이 색상은 **Data Visualization에만 사용**하며 Trade Type Toggle의
    Selected 상태에는 사용하지 않는다.

------------------------------------------------------------------------

## 4.7 Chart Legend

-   Overview Legend marker: `10 × 10px / radius 2px`
-   Compact Legend marker: `8 × 8px / radius 2px`
-   Marker ↔ Text gap: `6px`
-   Category label: Primary chart text
-   Count / Percentage: Secondary chart text
-   가능한 한 하나의 항목을 한 줄에 유지한다.
-   텍스트가 길 경우 Font size를 줄이지 않고 줄바꿈하거나 Legend 영역을
    조정한다.

------------------------------------------------------------------------

## 4.8 Chart Layout Rules

-   Chart는 Card 내부 좌우 Padding과 정렬선을 맞춘다.
-   Chart와 Legend 사이에 충분한 여백을 둔다.
-   동일한 종류의 Chart는 같은 화면에서 동일한 Size와 Legend 규칙을
    사용한다.
-   데이터 양에 따라 Color / Typography / Radius를 임의로 변경하지
    않는다.
-   불필요한 3D Effect / Gradient / Shadow를 사용하지 않는다.
-   과도한 Animation을 사용하지 않는다.
-   Chart 자체보다 Title / 핵심 수치 / 데이터 비교 관계가 먼저 읽히도록
    한다.
-   360px viewport에서 Chart와 Legend가 잘리거나 겹치지 않아야 한다.

------------------------------------------------------------------------

## 4.9 Chart Implementation Checklist

-   [ ] Chart Card가 `#FFFFFF / #EAEDF0 border / 16px radius`를 따른다.
-   [ ] Chart Typography가 Pretendard 및 정의된 크기를 따른다.
-   [ ] Buy는 Blue 계열, Sell은 Muted Gold 계열을 사용한다.
-   [ ] Line Chart의 Line width와 Point marker가 일관된다.
-   [ ] Progress Bar가 `8px height / 4px radius`를 따른다.
-   [ ] 동일한 수준의 Pie Chart는 같은 크기를 유지한다.
-   [ ] Pie Slice 사이에 White separator가 적용된다.
-   [ ] Legend의 Marker / Label / Count 위계가 일관된다.
-   [ ] 불필요한 Rainbow Color / Gradient / Shadow / 3D Effect를
    사용하지 않는다.
-   [ ] 360px viewport에서 Chart와 Legend가 겹치거나 잘리지 않는다.

------------------------------------------------------------------------

# 5. Error & Validation Pattern

## Field-level error

1.  Input border → `#D12921`
2.  Input background → white
3.  Error message → Input 아래 4px
4.  Error message → 11px / 400 / `#D12921`
5.  Error 여부를 색상만으로 전달하지 말고 메시지를 반드시 함께 표시

## Form-level error

-   Toast 또는 inline alert 사용
-   Toast를 사용할 경우 정의된 Toast 구조를 사용
-   별도 inline alert가 필요할 때만 `#FDEEF2` background 사용

------------------------------------------------------------------------

# 6. Accessibility Baseline

-   Back Button: visual 34px 유지, hit area 최소 44×44px
-   Button/Input: keyboard `focus-visible` 상태 제공
-   `#B9C0CC`는 중요한 본문 텍스트에 사용하지 않는다.
-   Error는 color + text message로 함께 전달한다.
-   핵심 interaction 요소는 hover만으로 상태를 전달하지 않는다.

**Scope note:** 전체 WCAG audit과 Dark Mode는 현재 디자인 시스템 범위
밖이다. 다만 새로 만드는 상태가 명백한 접근성 문제를 만들지 않도록 위
baseline은 적용한다.

------------------------------------------------------------------------

# 7. Implementation Guidelines

## 7.1 Design System Priority

UI 구현 시 색상, 타이포그래피, spacing, radius, component state는 이
문서의 정의를 기준으로 한다. 기능 요구사항이나 화면별 콘텐츠에 따라
레이아웃이 달라질 수 있으나, 동일 역할의 UI 요소는 동일한 디자인 규칙을
적용한다.

## 7.2 Token Usage

-   동일 역할의 color, spacing, radius, typography는 공통 token으로
    관리한다.
-   프로젝트의 기술 구조에 따라 CSS variable, theme, 공통 class,
    component style 등 적합한 방식을 사용할 수 있다.
-   아래 CSS variable 이름은 구현 예시이며 프로젝트 구조에 맞게 변경할
    수 있다.
-   **변수명은 변경할 수 있지만, 각 token의 의미와 정의된 값은 임의로
    변경하지 않는다.**
-   기술 구조상 token을 다른 방식으로 관리하더라도 동일한 semantic
    role과 value mapping을 유지한다.

### Reference CSS Variables

``` css
:root {
  /* Color - Action */
  --color-action-primary: #26314B;
  --color-action-primary-hover: #1F2940;
  --color-action-primary-active: #182136;
  --color-action-secondary: #476B9E;

  /* Color - Text */
  --color-text-primary: #000000;
  --color-text-secondary: #8B93A5;
  --color-text-tertiary: #B9C0CC;
  --color-text-inverse: #FFFFFF;

  /* Color - Surface */
  --color-surface-default: #FFFFFF;
  --color-surface-neutral: #F5F7FB;
  --color-surface-light: #EEF2FA;

  /* Color - Border */
  --color-border-default: #E9ECF2;
  --color-border-light: #F1F3F7;
  --color-border-subtle: #DFE3EA;

  /* Color - Status */
  --color-status-error: #D12921;
  --color-status-error-bg: #FDEEF2;

  /* Color - Control */
  --color-control-keypad-bg: #F7F8FA;
  --color-control-keypad-text: #253247;
  --color-control-disabled-bg: #A6A6A6;
  --color-control-disabled-text: #D9D9D9;

  /* Color - Trade Badge */
  --color-badge-buy-bg: #EEF4FD;
  --color-badge-buy-text: #476B9E;
  --color-badge-sell-bg: #FDEEF2;
  --color-badge-sell-text: #C75A6A;

  /* Spacing */
  --space-2xs: 4px;
  --space-xs: 8px;
  --space-sm: 12px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;

  /* Radius */
  --radius-xs: 4px;
  --radius-sm: 8px;
  --radius-control: 10px;
  --radius-md: 12px;
  --radius-card: 14px;

  /* Typography */
  --font-family-base: Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
```

## 7.3 Responsive

-   기준 viewport는 360px mobile이다.
-   Page horizontal padding은 16px이며, 최대 콘텐츠 가용 폭은 328px이다.
-   주요 full-width component는 `width: 100%`를 사용한다.
-   컴포넌트에 표기된 320px은 대표 시안 기준값이며 고정 width를 의미하지
    않는다.
-   실제 구현에서는 responsive layout을 사용한다.
-   360px viewport에서 horizontal overflow가 발생하지 않아야 한다.

## 7.4 Interaction

-   Hover: pointer 환경에서 상호작용 가능성을 보조적으로 표시한다.
-   Active/Pressed: 클릭 또는 터치 시 명확한 반응을 제공한다.
-   Focus: keyboard navigation을 위해 `focus-visible`에 해당하는 시각
    피드백을 제공한다.
-   Disabled: 시각적 비활성 상태와 실제 interaction 불가 상태를 함께
    적용한다.
-   Error: field border + text message를 기본 패턴으로 사용한다.

## 7.5 Out of Scope

다음 항목은 현재 디자인 시스템 범위에 포함하지 않는다.

-   Dark Mode
-   Gradient
-   종목별 Avatar color variant
-   추가 Font Weight
-   별도 Elevation system

------------------------------------------------------------------------

# 8. Component Implementation Checklist

개발 완료 전 공통 컴포넌트 기준으로 확인한다.

  ---------------------------------------------------------------------
  Component                          Required states / checks
  ---------------------------------- ----------------------------------
  Back Button                        Default / Hover / Active /
                                     Focus-visible / 44px hit area

  Primary Button                     Default / Hover / Active /
                                     Focus-visible / Disabled

  Input                              Default / Focus / Disabled / Error
                                     / Placeholder

  GNB                                Active / Inactive / fixed bottom /
                                     6px gap

  Trade Toggle                       Selected / Inactive / Disabled /
                                     neutral color / 10px container
                                     radius

  Trade Type Badge                   Buy / Sell / light tint / pill
                                     shape

  Numeric Keypad                     3×4 layout / 6px gap / KRW·USD
                                     variant

  Checkbox                           Checked / Unchecked

  Trade Record Row                   Avatar / typography / spacing

  Toast                              Base / semantic status content
  ---------------------------------------------------------------------

------------------------------------------------------------------------

# 9. Design System Checklist

화면 구현 시 다음 기준을 확인한다.

-   [ ] Font family가 Pretendard로 일관되게 적용되어 있다.
-   [ ] Primary CTA가 `#26314B`, 47px height, 10px radius 기준을 따른다.
-   [ ] Input이 white background + default border를 사용한다.
-   [ ] Input Error가 red border + error message 패턴을 따른다.
-   [ ] GNB gap이 6px이며 8px로 임의 변경되지 않았다.
-   [ ] Toggle container radius가 10px이며, 선택 상태에 매수/매도
    의미색을 사용하지 않는다.
-   [ ] 매수/매도 의미색은 Trade Type Badge에서만 연한 tint로 사용한다.
-   [ ] Avatar가 `#EEF2FA` 단일색이다.
-   [ ] Card에 임의의 shadow가 추가되지 않았다.
-   [ ] Back Button의 시각 크기는 34px이며 hit area는 최소 44px이다.
-   [ ] Focus-visible 상태가 Button/Input에 존재한다.
-   [ ] 360px viewport에서 horizontal overflow가 없다.
-   [ ] 동일 역할의 색상/spacing/radius가 화면별 임의값으로 중복
    정의되지 않았다.
-   [ ] Error/Disabled/Selected 등 상태가 필요한 컴포넌트에서 시각적으로
    구분된다.

------------------------------------------------------------------------

# 10. Final Decisions

아래 항목은 최종 확정값이며 별도 이슈가 없는 한 다시 디자인 선택지로
만들지 않는다.

-   Primary: `#26314B`
-   Secondary/Link: `#476B9E`
-   Font: Pretendard
-   Font weights: 400 / 600 / 700
-   Type role별 line-height 유지
-   Base Body: 13px
-   GNB gap: 6px
-   Primary Button: 47px height / 10px radius
-   Trade Toggle: 10px container radius / 8px segment radius / neutral
    selected state
-   Trade Type Badge: Buy `#EEF4FD` + `#476B9E` / Sell `#FDEEF2` +
    `#C75A6A`
-   Avatar: `#EEF2FA` 단일색
-   Input: white background / 44px height / 8px radius
-   Input Error: white background + `#D12921` border + error message
-   Back Button: visual 34px / hit area ≥ 44px
-   Card shadow: none by default
-   Avatar color variants: 사용하지 않음
-   9px Label: 기본 type scale에서 제외
-   Dark Mode: 현재 범위에서 지원하지 않음

------------------------------------------------------------------------

**Document status: FINAL**
