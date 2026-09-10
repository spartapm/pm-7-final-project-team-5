export const TERMS_ITEMS = [
  { id: "age", required: true, label: "만 14세 이상입니다", href: "https://topaz-dentist-95d.notion.site/14-3cf469365df880428689e2cf9219cce0" },
  { id: "service", required: true, label: "서비스 이용약관 동의", href: "https://topaz-dentist-95d.notion.site/3cf469365df8808ea351fd90bef1f9f6" },
  { id: "privacy", required: true, label: "개인정보 처리방침 동의", href: "https://topaz-dentist-95d.notion.site/3cf469365df8808b8d3dd5df2072aeaf" },
] as const;

export const TERMS_VIEW = {
  age: "https://topaz-dentist-95d.notion.site/14-3cf469365df880428689e2cf9219cce0",
  service: "https://topaz-dentist-95d.notion.site/3cf469365df8808ea351fd90bef1f9f6",
  privacy: "https://topaz-dentist-95d.notion.site/3cf469365df8808b8d3dd5df2072aeaf",
} as const;

export const AGE_BODY = `만 14세 이상 이용 확인

1. 인플롯은 만 14세 이상만 이용할 수 있습니다.
2. 만 14세 미만은 법정대리인 동의 없이는 가입할 수 없습니다.
3. 허위로 연령을 입력한 경우 이용이 제한될 수 있습니다.`;

export const TERMS_BODY = `인플롯 서비스 이용약관

1. 본 서비스는 이용자가 입력한 매매 기록을 바탕으로 지난 판단의 경향을 보여 주는 기록·정리 도구입니다.
2. 인플롯은 투자자문업자 또는 유사투자자문업자가 아니며, 특정 종목의 매매를 권유하지 않습니다.
3. 투자 판단과 그 결과에 대한 책임은 이용자 본인에게 있습니다.
4. 연습 기록은 계정에 저장되지 않으며, 실제 매매 기록은 계정에 저장됩니다.
5. 계정 탈퇴 시 해당 계정의 클라우드 기록은 삭제됩니다.`;

export const PRIVACY_BODY = `인플롯 개인정보 처리방침

1. 수집 항목: 카카오 회원번호(식별값), 이메일(이메일 가입 시), 서비스 닉네임, 이용자가 입력한 매매 계획·기록. 카카오 로그인에서는 이메일을 수집하지 않고 회원번호만 사용합니다.
2. 이용 목적: 로그인, 기록 동기화, 반복 조합 인사이트 문장 생성.
3. 보관: 이용자가 탈퇴하거나 삭제를 요청할 때까지 보관합니다.
4. 제3자 제공: 카카오 로그인 처리, 클라우드 저장(Supabase), 인사이트 문장 생성(Anthropic) 외에 판매하지 않습니다.
5. 문의: 서비스 내 탈퇴 기능으로 계정과 기록을 삭제할 수 있습니다.`;
