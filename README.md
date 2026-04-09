# MangoI Video - 망고아이 화상영어 솔루션

WebRTC 기반 자체 화상영어 솔루션입니다.

## 주요 기능

- 화상 통화: WebRTC 기반 1:1 및 그룹 영상 통화
- 판서 기능: 실시간 화이트보드
- 메신저: 실시간 채팅
- 녹화 기능: 수업 녹화 및 다운로드
- 수업 등록/관찰/데모방

## 기술 스택

- Next.js 16 + TypeScript + Tailwind CSS + WebRTC
- Server-Sent Events (SSE) 기반 시그널링 서버

## 프로젝트 구조

```
src/
├── app/
│   ├── api/signaling/    # SSE 시그널링 서버
│   ├── lobby/            # 수업 로비 (방 생성/참여)
│   ├── room/[roomId]/    # 화상 수업 방
│   ├── layout.tsx        # 루트 레이아웃
│   ├── page.tsx          # 랜딩 페이지
│   └── globals.css       # 글로벌 스타일
├── components/
│   ├── ChatPanel.tsx     # 채팅 패널
│   ├── ControlBar.tsx    # 하단 컨트롤 바
│   ├── VideoPlayer.tsx   # 비디오 플레이어
│   └── Whiteboard.tsx    # 화이트보드 (판서)
├── hooks/
│   ├── useWebRTC.ts      # WebRTC 피어 연결 훅
│   └── useRecorder.ts    # 녹화 기능 훅
└── lib/
    └── signaling.ts      # 시그널링 클라이언트
```

## 시작하기

```bash
npm install
npm run dev
```
