const supertest = require("supertest");
const app = require("../../app");
const { sequelize } = require("../../models/index");

beforeAll(async () => {
  if (process.env.DB_NAME === "customWorldcup_test") {
    await sequelize.sync();
  } else {
    throw new Error(
      "DB_NAME이 customWorldcup_test 환경으로 설정되어 있지 않습니다."
    );
  }
});

describe("로그인 한 상태로 comment crud success test", () => {
  const agent = supertest.agent(app);
  agent
    .post("/api/auth/signup")
    .send({
      nickname: "test1",
      password: "abcd1234!",
      email: "test1@naver.com",
    })
    .expect(200);

  agent
    .post("/api/auth/signup")
    .send({
      nickname: "test2",
      password: "abcd1234!",
      email: "test2@naver.com",
    })
    .expect(200);
  beforeEach(async () => {
    await agent
      .post("/api/auth/login")
      .send({
        nickname: "test4231",
        password: "abcd1234!",
      })
      .expect(200);
  });

  test("로그인한 상태로 worldcup 작성", () => {
    agent
      .post("/api/worldcup")
      .send({
        title: "드라마 월드컵!",
        content: "인생 드라마 고르기",
        choices: [
          {
            choice_name: "도깨비",
            choice_url:
              "https://i.namu.wiki/i/noasfParD7FkoA3kIkwJxTx1SLhE0voXLNCK6Q3Li0P0435poNTQD9ZFdwS0gKmUtkxfPtmkhZmah_KlC_mlupAfh105J4b6BbM6hBR5myWEh9g44U2lmOcwEMEYy1W_XCgDni70CV-0vilrxNcc3Q.webp",
          },
          {
            choice_name: "이상한 변호사 우영우",
            choice_url:
              "https://i.namu.wiki/i/Pa2G4uR4bpcE_nrT8MBw5C8DWkDviK4oLP1NCsrkjirs4JlXYFwsudKsk8ExqwptfcKfyJIcCWczkIbmFbENkXV4idBubECUz46iKEx1EXDMEyUNWwuauTyn_bzdBrtu1BFGP4OA4fRD7AxapcegGQ.webp",
          },
        ],
      })
      .expect(201);
  });

  test("로그인한 상태에서 comment 생성", () => {
    agent
      .post("/api/worldcup/1/comments")
      .send({
        comment: "댓글입니다.",
      })
      .expect(200);
  });

  test("comment 조회", () => {
    agent.get("/api/worldcup/1/comments").expect(200);
  });

  test("로그인한 상태에서 comment 수정", () => {
    agent
      .put("/api/worldcup/1/comments/1")
      .send({
        comment: "수정된 댓글입니다.",
      })
      .expect(200);
  });

  test("로그인한 상태에서 comment 삭제", () => {
    agent.delete("/api/worldcup/1/comments/1").expect(200);
  });
});

afterAll(async () => {
  // 통합 테스트가 완료되었을 경우 sequelize의 연결된 테이블들의 정보를 초기화합니다.
  if (process.env.DB_NAME === "customWorldcup_test") {
    await sequelize.sync();
  } else {
    throw new Error(
      "DB_NAME이 customWorldcup_test 환경으로 설정되어 있지 않습니다."
    );
  }
});
