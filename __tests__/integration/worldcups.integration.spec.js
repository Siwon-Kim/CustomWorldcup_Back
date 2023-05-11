const supertest = require("supertest");
const app = require("../../app.js");
const { sequelize } = require("../../models/index.js");

// 통합 테스트(Integration Test)를 진행하기에 앞서 Sequelize에 연결된 모든 테이블의 데이터를 삭제합니다.
// 단, NODE_ENV가 test 환경으로 설정되어있는 경우에만 데이터를 삭제합니다.
beforeAll(async () => {
  if (process.env.NODE_ENV === "test") await sequelize.sync();
  else throw new Error("NODE_ENV가 test 환경으로 설정되어 있지 않습니다.");
});

describe("Worldcups Domain 통합 테스트", () => {
  userData = {
    user_id: 1,
    nickname: "siwon",
    password: "1234",
    email: "siwon@naver.com",
  };

  userData2 = {
    user_id: 2,
    nickname: "school",
    password: "1234",
    email: "school@naver.com",
  };

  worldcupData = {
    worldcup_id: 1,
    title: "고양이 월드컵!",
    content: "제일 귀여운 고양이 고르기",
    choices: [
      {
        choice_name: "고양이",
        choice_url:
          "https://img.freepik.com/free-photo/adorable-kitty-looking-like-it-want-to-hunt_23-2149167099.jpg?size=626&ext=jpg",
      },
      {
        choice_name: "고양이",
        choice_url:
          "https://img.freepik.com/free-photo/adorable-kitty-looking-like-it-want-to-hunt_23-2149167099.jpg?size=626&ext=jpg",
      },
    ],
  };

  worldcupData2 = {
    worldcup_id: 2,
    title: "강아지 월드컵!",
    content: "제일 귀여운 강아지 고르기",
    choices: [
      {
        choice_name: "강아지",
        choice_url:
          "https://img.freepik.com/free-photo/adorable-kitty-looking-like-it-want-to-hunt_23-2149167099.jpg?size=626&ext=jpg",
      },
      {
        choice_name: "강아지",
        choice_url:
          "https://img.freepik.com/free-photo/adorable-kitty-looking-like-it-want-to-hunt_23-2149167099.jpg?size=626&ext=jpg",
      },
    ],
  };

  /** user_id = 1를 가진 유저로 회원가입, 로그인 **/
  test("GET /api/worldcup API (getAllWorldcups) Integration Test Error Case, Not Found Worldcups Data", async () => {
    const response = await supertest(app).get(`/api/worldcup`); // API의 HTTP Method & URL

    /** GET /api/worldcup API의 검증 로직 **/
    // 1. API를 호출하였을 때, 월드컵 데이터가 없으면 404 Http Status Code를 반환한다.
    expect(response.status).toEqual(404);
    // 2. API의 Response는 아무런 데이터를 삽입하지 않은 상태이므로 { errorMessage: "월드컵 게시물이 존재하지 않습니다." }의 형태를 가진다.
    expect(response.body).toEqual({
      errorMessage: "월드컵 게시물이 존재하지 않습니다.",
    });
  });

  test("POST /api/auth/signup API (signup) Integration Test", async () => {
    const signupRequestBodyParams = {
      nickname: userData.nickname,
      password: userData.password,
      email: userData.email,
    };

    const response = await supertest(app)
      .post(`/api/auth/signup`) // API의 HTTP Method & URL
      .send(signupRequestBodyParams); // Request Body

    /** POST /api/auth/signup API의 검증 로직 **/
    // 1. API를 호출하였을 때, 성공적으로 실행할 경우 200 Http Status Code를 반환한다.
    expect(response.status).toEqual(200);
    // 2. API를 호출하였을 때, 성공적으로 실행할 경우 { message: "회원 가입 완료" }를 반환한다.
    expect(response.body).toEqual({
      message: "회원 가입 완료",
    });
  });

  test("POST /api/auth/login API (login) Integration Test", async () => {
    const loginRequestBodyParams = {
      nickname: userData.nickname,
      password: userData.password,
    };

    const response = await supertest(app)
      .post(`/api/auth/login`) // API의 HTTP Method & URL
      .send(loginRequestBodyParams); // Request Body

    /** POST /api/auth/login API의 검증 로직 **/
    // 1. API를 호출하였을 때, 로그인이 성공적으로 실행할 경우 200 Http Status Code를 반환한다.
    expect(response.status).toEqual(200);
    // 2. API 호출이 완료되면, Authorization과 refreshtoken 값을 body 데이터로 전달한다.
    userData.accessToken = response.body.Authorization;
    userData.refreshToken = response.body.refreshtoken;
  });

  test("POST /api/worldcup API (createWorldcup) Integration Test Success Case: 첫번째 월드컵", async () => {
    const createWorldcupRequestBodyParams = {
      title: worldcupData.title,
      content: worldcupData.content,
      choices: worldcupData.choices,
    };

    const response = await supertest(app)
      .post(`/api/worldcup`) // API의 HTTP Method & URL
      .set("Authorization", `Bearer ${userData.accessToken}`) // 헤더에 Access Token 세팅
      .set("refreshtoken", `${userData.refreshToken}`) // 헤더에 Refresh Token 세팅
      .send(createWorldcupRequestBodyParams); // Request Body

    /** POST /api/worldcup API의 성공 케이스 검증 로직 **/
    // 1. API를 호출하였을 때, 성공적으로 실행할 경우 201 Http Status Code를 반환한다.
    expect(response.status).toEqual(201);
    // 2. API의 Response는 { newWorldcup: worldcup_id, user_id, title, content, choices }의 형식을 가집니다.
    expect(response.body).toMatchObject({
      newWorldcup: {
        worldcup_id: worldcupData.worldcup_id,
        user_id: userData.user_id,
        title: createWorldcupRequestBodyParams.title,
        content: createWorldcupRequestBodyParams.content,
        choices: createWorldcupRequestBodyParams.choices,
      },
    });
  });

  test("POST /api/worldcup API (createWorldcup) Integration Test Success Case: 두번째 월드컵", async () => {
    const createWorldcupRequestBodyParams = {
      title: worldcupData2.title,
      content: worldcupData2.content,
      choices: worldcupData2.choices,
    };

    const response = await supertest(app)
      .post(`/api/worldcup`) // API의 HTTP Method & URL
      .set("Authorization", `Bearer ${userData.accessToken}`) // 헤더에 Access Token 세팅
      .set("refreshtoken", `${userData.refreshToken}`) // 헤더에 Refresh Token 세팅
      .send(createWorldcupRequestBodyParams); // Request Body

    /** POST /api/worldcup API의 성공 케이스 검증 로직 **/
    // 1. API를 호출하였을 때, 성공적으로 실행할 경우 201 Http Status Code를 반환한다.
    expect(response.status).toEqual(201);
    // 2. API의 Response는 { newWorldcup: worldcup_id, user_id, title, content, choices }의 형식을 가집니다.
    expect(response.body).toMatchObject({
      newWorldcup: {
        worldcup_id: worldcupData2.worldcup_id,
        user_id: userData.user_id,
        title: createWorldcupRequestBodyParams.title,
        content: createWorldcupRequestBodyParams.content,
        choices: createWorldcupRequestBodyParams.choices,
      },
    });
  });

  test("POST /api/worldcup API (createWorldcup) Integration Test Error Case, Invalid Params Error", async () => {
    const createWorldcupRequestBodyParamsByInvalidParamsError = {
      title: "Title_InvalidParamsError",
      content: "Content_InvalidParamsError",
    };

    const response = await supertest(app)
      .post(`/api/worldcup`) // API의 HTTP Method & URL
      .set("Authorization", `Bearer ${userData.accessToken}`) // 헤더에 Access Token 세팅
      .set("refreshtoken", `${userData.refreshToken}`) // 헤더에 Refresh Token 세팅
      .send(createWorldcupRequestBodyParamsByInvalidParamsError); // Request Body

    /** POST /api/worldcup API의 에러 케이스 검증 로직 **/
    // 1. API를 호출하였을 때, InvalidParamsError가 발생하여 412 Http Status Code를 반환합니다.
    expect(response.status).toEqual(412);
    // 2. API의 Response는 { errorMessage: '"choices" is required' }의 형식을 가집니다.
    expect(response.body).toMatchObject({
      errorMessage: '"choices" is required',
    });
  });

  test("GET /api/worldcup API (getAllWorldcups) Integration Test Success Case, Existing Worldcups Data", async () => {
    const response = await supertest(app).get(`/api/worldcup`); // API의 HTTP Method & URL

    /** GET /api/worldcup API의 검증 로직 **/
    // 1. API를 호출하였을 때, 성공적으로 실행할 경우 200 Http Status Code를 반환한다.
    expect(response.status).toEqual(200);
    // 2. API의 Response는 1개의 데이터를 생성한 상태이므로 { worldcups: [ { worldcup_id, user_id, nickname, title, content, likes, play_count, createdAt, updatedAt, choices }] }의 형태를 가진다.
    expect(response.body).toMatchObject({
      worldcups: [
        {
          worldcup_id: worldcupData.worldcup_id,
          user_id: userData.user_id,
          nickname: userData.nickname,
          title: worldcupData.title,
          content: worldcupData.content,
          choices: worldcupData.choices,
          likes: expect.anything(),
          play_count: expect.anything(),
          createdAt: expect.anything(),
          updatedAt: expect.anything(),
        },
        {
          worldcup_id: worldcupData2.worldcup_id,
          user_id: userData.user_id,
          nickname: userData.nickname,
          title: worldcupData2.title,
          content: worldcupData2.content,
          choices: worldcupData2.choices,
          likes: expect.anything(),
          play_count: expect.anything(),
          createdAt: expect.anything(),
          updatedAt: expect.anything(),
        },
      ],
    });
  });

  test("GET /api/worldcup/:worldcup_id API (getOneWorldcup) Integration Test Error Case, Not Found Worldcup Data", async () => {
    const response = await supertest(app).get(`/api/worldcup/100`); // API의 HTTP Method & URL

    /** GET /api/worldcup/:worldcup_id API의 검증 로직 **/
    // 1. API를 호출하였을 때, worldcup_id에 해당하는 월드컵 데이터가 없으면 404 Http Status Code를 반환한다.
    expect(response.status).toEqual(404);
    // 2. API의 Response는 아무런 데이터를 삽입하지 않은 상태이므로 { errorMessage: "월드컵 게시물이 존재하지 않습니다." }의 형태를 가진다.
    expect(response.body).toEqual({
      errorMessage: "월드컵 게시물이 존재하지 않습니다.",
    });
  });

  test("GET /api/worldcup/:worldcup_id API (getOneWorldcup) Integration Test Success Case, Existing Worldcup Data", async () => {
    const worldcupReturnedValue = {
      worldcup_id: worldcupData.worldcup_id,
      user_id: userData.user_id,
      nickname: userData.nickname,
      title: worldcupData.title,
      content: worldcupData.content,
      choices: worldcupData.choices,
      likes: expect.anything(),
      play_count: expect.anything(),
      createdAt: expect.anything(),
      updatedAt: expect.anything(),
    };

    const response = await supertest(app).get(
      `/api/worldcup/${worldcupData.worldcup_id}`
    ); // API의 HTTP Method & URL

    /** GET /api/worldcup/:worldcup_id API의 검증 로직 **/
    // 1. API를 호출하였을 때, 성공적으로 실행할 경우 200 Http Status Code를 반환한다.
    expect(response.status).toEqual(200);
    // 2. API의 Response는 { worldcup: { worldcup_id, user_id, nickname, title, content, likes, play_count, createdAt, updatedAt, choices } }의 형태를 가진다.
    expect(response.body).toMatchObject({
      worldcup: {
        worldcup_id: worldcupReturnedValue.worldcup_id,
        user_id: userData.user_id,
        nickname: userData.nickname,
        title: worldcupReturnedValue.title,
        content: worldcupReturnedValue.content,
        choices: worldcupReturnedValue.choices,
        likes: expect.anything(),
        play_count: expect.anything(),
        createdAt: expect.anything(),
        updatedAt: expect.anything(),
      },
    });
  });

  test("PATCH /api/worldcup/:worldcup_id API (updateWorldcup) Integration Test Success Case", async () => {
    const updateWorldcupRequestBodyParams = {
      title: "변경된 제목",
      content: "변경된 내용",
    };

    const response = await supertest(app)
      .patch(`/api/worldcup/${worldcupData.worldcup_id}`) // API의 HTTP Method & URL
      .set("Authorization", `Bearer ${userData.accessToken}`) // 헤더에 Access Token 세팅
      .set("refreshtoken", `${userData.refreshToken}`) // 헤더에 Refresh Token 세팅
      .send(updateWorldcupRequestBodyParams); // Request Body

    /** PATCH /api/worldcup/:worldcup_id API의 성공 케이스 검증 로직 **/
    // 1. API를 호출하였을 때, 성공적으로 실행할 경우 200 Http Status Code를 반환한다.
    expect(response.status).toEqual(200);
    // 2. API의 Response는 { updatedWorldcup: worldcup_id, user_id, title, content }의 형식을 가집니다.
    expect(response.body).toMatchObject({
      updatedWorldcup: {
        worldcup_id: worldcupData.worldcup_id.toString(), // 왜 얘만 body에 string으로 넘어오지????
        user_id: userData.user_id,
        title: updateWorldcupRequestBodyParams.title,
        content: updateWorldcupRequestBodyParams.content,
      },
    });
  });

  test("PATCH /api/worldcup/:worldcup_id (updateWorldcup) Integration Test Error Case, Not Found Worldcup Data", async () => {
    const updateWorldcupRequestBodyParams = {
      title: "변경된 제목",
      content: "변경된 내용",
    };

    const response = await supertest(app)
      .patch(`/api/worldcup/100`) // API의 HTTP Method & URL
      .set("Authorization", `Bearer ${userData.accessToken}`) // 헤더에 Access Token 세팅
      .set("refreshtoken", `${userData.refreshToken}`) // 헤더에 Refresh Token 세팅
      .send(updateWorldcupRequestBodyParams); // Request Body

    /** PATCH /api/worldcup/:worldcup_id API의 에러 케이스 검증 로직 **/
    // 1. API를 호출하였을 때, worldcup_id에 해당하는 월드컵 데이터가 없으면 404 Http Status Code를 반환한다.
    expect(response.status).toEqual(404);
    // 2. API의 Response는 { errorMessage: "월드컵 게시물이 존재하지 않습니다." }의 형식을 가집니다.
    expect(response.body).toMatchObject({
      errorMessage: "월드컵 게시물이 존재하지 않습니다.",
    });
  });

  test("PATCH /api/worldcup/:worldcup_id (updateWorldcup) Integration Test Error Case, Invalid Params Error", async () => {
    const updateWorldcupRequestBodyParamsByInvalidParamsError = {
      title: 12345,
    };

    const response = await supertest(app)
      .patch(`/api/worldcup/${worldcupData.worldcup_id}`) // API의 HTTP Method & URL
      .set("Authorization", `Bearer ${userData.accessToken}`) // 헤더에 Access Token 세팅
      .set("refreshtoken", `${userData.refreshToken}`) // 헤더에 Refresh Token 세팅
      .send(updateWorldcupRequestBodyParamsByInvalidParamsError); // Request Body

    /** PATCH /api/worldcup/:worldcup_id API의 에러 케이스 검증 로직 **/
    // 1. API를 호출하였을 때, InvalidParamsError가 발생하여 412 Http Status Code를 반환합니다.
    expect(response.status).toEqual(412);
    // 2. API의 Response는 title에 String이 아닌 값이 들어가, { errorMessage: "월드컵 제목의 형식이 올바르지 않습니다." }의 형식을 가집니다.
    expect(response.body).toMatchObject({
      errorMessage: "월드컵 제목의 형식이 올바르지 않습니다.",
    });
  });

  test("DELETE /api/worldcup/:worldcup_id API (deleteWorldcup) Integration Test Success Case", async () => {
    const response = await supertest(app)
      .delete(`/api/worldcup/${worldcupData.worldcup_id}`) // API의 HTTP Method & URL
      .set("Authorization", `Bearer ${userData.accessToken}`) // 헤더에 Access Token 세팅
      .set("refreshtoken", `${userData.refreshToken}`); // 헤더에 Refresh Token 세팅

    /** DELETE /api/worldcup/:worldcup_id API의 성공 케이스 검증 로직 **/
    // 1. API를 호출하였을 때, 성공적으로 실행할 경우 200 Http Status Code를 반환한다.
    expect(response.status).toEqual(200);
    // 2. API의 Response는 { message: "월드컵 삭제 완료" }의 형식을 가집니다.
    expect(response.body).toMatchObject({ message: "월드컵 삭제 완료" });
  });

  test("DELETE /api/worldcup/:worldcup_id (deleteWorldcup) Integration Test Error Case, Not Found Worldcups Data Error", async () => {
    const response = await supertest(app)
      .delete(`/api/worldcup/100`) // API의 HTTP Method & URL
      .set("Authorization", `Bearer ${userData.accessToken}`) // 헤더에 Access Token 세팅
      .set("refreshtoken", `${userData.refreshToken}`); // 헤더에 Refresh Token 세팅

    /** DELETE /api/worldcup/:worldcup_id API의 에러 케이스 검증 로직 **/
    // 1. API를 호출하였을 때, worldcup_id에 해당하는 월드컵 데이터가 없으면 404 Http Status Code를 반환한다.
    expect(response.status).toEqual(404);
    // 2. API의 Response는 { errorMessage: "월드컵 게시물이 존재하지 않습니다." }의 형식을 가집니다.
    expect(response.body).toMatchObject({
      errorMessage: "월드컵 게시물이 존재하지 않습니다.",
    });
  });

  /** user_id = 2를 가진 다른 유저로 회원가입, 로그인 **/
  test("POST /api/auth/signup API (signup) Integration Test (user_id = 2)", async () => {
    const signupRequestBodyParams = {
      nickname: userData2.nickname,
      password: userData2.password,
      email: userData2.email,
    };

    const response = await supertest(app)
      .post(`/api/auth/signup`) // API의 HTTP Method & URL
      .send(signupRequestBodyParams); // Request Body

    /** POST /api/auth/signup API의 검증 로직 **/
    // 1. API를 호출하였을 때, 성공적으로 실행할 경우 200 Http Status Code를 반환한다.
    expect(response.status).toEqual(200);
    // 2. API를 호출하였을 때, 성공적으로 실행할 경우 { message: "회원 가입 완료" }를 반환한다.
    expect(response.body).toEqual({
      message: "회원 가입 완료",
    });
  });

  test("POST /api/auth/login API (login) Integration Test (user_id = 2)", async () => {
    const loginRequestBodyParams = {
      nickname: userData2.nickname,
      password: userData.password,
    };

    const response = await supertest(app)
      .post(`/api/auth/login`) // API의 HTTP Method & URL
      .send(loginRequestBodyParams); // Request Body

    /** POST /api/auth/login API의 검증 로직 **/
    // 1. API를 호출하였을 때, 로그인이 성공적으로 실행할 경우 200 Http Status Code를 반환한다.
    expect(response.status).toEqual(200);
    // 2. API 호출이 완료되면, Authorization과 refreshtoken 값을 body 데이터로 전달한다.
    userData.accessToken = response.body.Authorization;
    userData.refreshToken = response.body.refreshtoken;
  });

  test("PATCH /api/worldcup/:worldcup_id (updateWorldcup) Integration Test Error Case, No Permissions to Update Error", async () => {
    const updateWorldcupRequestBodyParams = {
      title: "변경된 제목",
      content: "변경된 내용",
    };

    const response = await supertest(app)
      .patch(`/api/worldcup/${worldcupData2.worldcup_id}`) // API의 HTTP Method & URL
      .set("Authorization", `Bearer ${userData.accessToken}`) // 헤더에 Access Token 세팅
      .set("refreshtoken", `${userData.refreshToken}`) // 헤더에 Refresh Token 세팅
      .send(updateWorldcupRequestBodyParams); // Request Body

    /** PATCH /api/worldcup/:worldcup_id API의 에러 케이스 검증 로직 **/
    // 1. API를 호출하였을 때, 해당 게시물에 대한 수정 권한이 없으면 403 Http Status Code를 반환한다.
    expect(response.status).toEqual(403);
    // 2. API의 Response는 { errorMessage: "월드컵 게시물 수정 권한이 없습니다." }의 형식을 가집니다.
    expect(response.body).toMatchObject({
      errorMessage: "월드컵 게시물 수정 권한이 없습니다.",
    });
  });

  test("DELETE /api/worldcup/:worldcup_id (updateWorldcup) Integration Test Error Case, No Permissions to Update Error", async () => {
    const updateWorldcupRequestBodyParams = {
      title: "변경된 제목",
      content: "변경된 내용",
    };

    const response = await supertest(app)
      .delete(`/api/worldcup/${worldcupData2.worldcup_id}`) // API의 HTTP Method & URL
      .set("Authorization", `Bearer ${userData.accessToken}`) // 헤더에 Access Token 세팅
      .set("refreshtoken", `${userData.refreshToken}`) // 헤더에 Refresh Token 세팅
      .send(updateWorldcupRequestBodyParams); // Request Body

    /** DELETE /api/worldcup/:worldcup_id API의 에러 케이스 검증 로직 **/
    // 1. API를 호출하였을 때, 해당 게시물에 대한 삭제 권한이 없으면 403 Http Status Code를 반환한다.
    expect(response.status).toEqual(403);
    // 2. API의 Response는 { errorMessage: "월드컵 게시물 삭제 권한이 없습니다." }의 형식을 가집니다.
    expect(response.body).toMatchObject({
      errorMessage: "월드컵 게시물 삭제 권한이 없습니다.",
    });
  });
});

afterAll(async () => {
  // 통합 테스트가 완료되었을 경우 sequelize의 연결된 테이블들의 정보를 초기화합니다.
  if (process.env.NODE_ENV === "test") await sequelize.sync({ force: true });
  else throw new Error("NODE_ENV가 test 환경으로 설정되어 있지 않습니다.");
});
