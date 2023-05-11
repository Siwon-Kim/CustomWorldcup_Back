const WorldcupRepository = require("../repositories/worldcup.repository");

const WorldcupChoicesRepository = require("../repositories/worldcup.choice.repository");
const UsersRepository = require("../repositories/users.repository");
const { Worldcups, Worldcup_choices, Users } = require("../models");

const { Transaction } = require("sequelize");
const { sequelize } = require("../models");

class WorldcupService {
  worldcupRepository = new WorldcupRepository(Worldcups);
  worldcupChoicesRepository = new WorldcupChoicesRepository(Worldcup_choices);
  usersRepository = new UsersRepository(Users);

  createWorldcup = async (user_id, title, content, choices) => {
    try {
      let createdWorldcup;
      await sequelize.transaction(
        {
          isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED,
        },
        async (t) => {
          const newWorldcup = await this.worldcupRepository.create(
            user_id,
            title,
            content
          );

          const worldcup_id = newWorldcup.dataValues.worldcup_id;

          await Promise.all(
            choices.map(async (choice) => {
              await this.worldcupChoicesRepository.createChoice(
                worldcup_id,
                choice.choice_name,
                choice.choice_url
              );
            })
          );

          createdWorldcup = {
            worldcup_id,
            user_id,
            title,
            content,
            choices,
          };
        }
      );
      return createdWorldcup;
    } catch (error) {
      throw error;
    }
  };

  getAllWorldcups = async () => {
    const allWorldcups = await this.worldcupRepository.getAll();
    if (allWorldcups.length === 0) {
      const error = new Error();
      error.errorCode = 404;
      error.message = "월드컵 게시물이 존재하지 않습니다.";
      throw error;
    }

    const choices = await Promise.all(
      allWorldcups.map(async (worldcup) => {
        const worldcup_id = worldcup.dataValues.worldcup_id;
        const choices =
          await this.worldcupChoicesRepository.findAllWorldcupChoices(
            worldcup_id
          );

        const worldcupChoices = choices.map((choice) => ({
          choice_name: choice.choice_name,
          choice_url: choice.choice_url,
        }));

        return {
          worldcup_id: worldcup.dataValues.worldcup_id,
          user_id: worldcup.dataValues.user_id,
          nickname: worldcup.dataValues.nickname,
          title: worldcup.dataValues.title,
          content: worldcup.dataValues.content,
          likes: worldcup.dataValues.likes,
          play_count: worldcup.dataValues.play_count,
          createdAt: worldcup.dataValues.createdAt,
          updatedAt: worldcup.dataValues.updatedAt,
          choices: worldcupChoices,
        };
      })
    );
    return choices;
  };

  getOneWorldcup = async (worldcup_id) => {
    const worldcup = await this.worldcupRepository.getOne(worldcup_id);
    if (!worldcup) {
      const error = new Error();
      error.errorCode = 404;
      error.message = "월드컵 게시물이 존재하지 않습니다.";
      throw error;
    }

    const worldcup_choices = worldcup.Worldcup_choices.map((choice) => ({
      choice_name: choice.choice_name,
      choice_url: choice.choice_url,
      worldcup_choice_id: choice.worldcup_choice_id,
    }));

    return {
      worldcup_id: worldcup.dataValues.worldcup_id,
      user_id: worldcup.dataValues.user_id,
      nickname: worldcup.dataValues.nickname,
      title: worldcup.dataValues.title,
      content: worldcup.dataValues.content,
      likes: worldcup.dataValues.likes,
      play_count: worldcup.dataValues.play_count,
      createdAt: worldcup.dataValues.createdAt,
      updatedAt: worldcup.dataValues.updatedAt,
      choices: worldcup_choices,
    };
  };

  updateWorldcup = async (title, content, worldcup_id, user_id) => {
    try {
      let updatedWorldcup;
      await sequelize.transaction(
        {
          isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED,
        },
        async (t) => {
          const worldcup = await this.worldcupRepository.getOne(worldcup_id);
          if (!worldcup) {
            const error = new Error();
            error.errorCode = 404;
            error.message = "월드컵 게시물이 존재하지 않습니다.";
            throw error;
          }
          if (worldcup.user_id !== user_id) {
            const error = new Error();
            error.errorCode = 403;
            error.message = "월드컵 게시물 수정 권한이 없습니다.";
            throw error;
          }

          await this.worldcupRepository.update(
            title,
            content,
            worldcup_id,
            user_id
          );

          updatedWorldcup = {
            worldcup_id,
            user_id,
            title,
            content,
          };
        }
      );
      return updatedWorldcup;
    } catch (error) {
      throw error;
    }
  };

  deleteWorldcup = async (worldcup_id, user_id) => {
    const worldcup = await this.worldcupRepository.getOne(worldcup_id);
    if (!worldcup) {
      const error = new Error();
      error.errorCode = 404;
      error.message = "월드컵 게시물이 존재하지 않습니다.";
      throw error;
    }
    if (worldcup.user_id !== user_id) {
      const error = new Error();
      error.errorCode = 403;
      error.message = "월드컵 게시물 삭제 권한이 없습니다.";
      throw error;
    }

    await this.worldcupRepository.remove(worldcup_id, user_id);
  };

  // 월드컵 결과 정하기
  postWorldcupResult = async (worldcupResultData) => {
    console.log("worldcupResultData", worldcupResultData);
    await this.worldcupExistAssert(worldcupResultData.worldcup_id);
    await this.choiceExistAssert(worldcupResultData.worldcup_choice_id);

    // 월드컵 결과 저장
    await this.worldcupChoicesRepository.createResult(worldcupResultData);

    // 월드컵 진행 횟수 1 증가
    await this.worldcupRepository.increasePlayCount(
      worldcupResultData.worldcup_id
    );

    // 월드컵 선택지 승리 횟수 1 증가
    await this.worldcupChoicesRepository.increaseWinCount(
      worldcupResultData.worldcup_choice_id
    );
  };

  getWorldcupResult = async (worldcup_id, user_id, worldcup_choice_id) => {
    const worldcupChoiceResult = await this.worldcupChoicesRepository.findOne(
      worldcup_choice_id
    );
    const worldcupResult = await this.worldcupRepository.getOne(worldcup_id);

    if (!worldcupChoiceResult) {
      const error = new Error();
      error.errorCode = 404;
      error.message = "월드컵 게시물이 존재하지 않습니다.";
      throw error;
    }

    if (!worldcupResult) {
      const error = new Error();
      error.errorCode = 404;
      error.message = "월드컵 선택지가 존재하지 않습니다.";
      throw error;
    }

    const play_count = worldcupResult.play_count;
    const win_count = worldcupChoiceResult.win_count;

    const win_percentage =
      play_count !== 0 ? (win_count / play_count) * 100 : 0;

    console.log(win_percentage);
    return {
      worldcup_id: worldcupResult.worldcup_id,
      user_id: worldcupResult.user_id,
      choice_name: worldcupChoiceResult.choice_name,
      choice_url: worldcupChoiceResult.choice_url,
      title: worldcupResult.title,
      content: worldcupResult.content,
      win_count: worldcupChoiceResult.win_count,
      play_count: worldcupResult.play_count,
      win_percentage: win_percentage.toFixed(0),
    };
  };

  // 월드컵 존재 확인
  worldcupExistAssert = async (worldcup_id) => {
    const worldcup = await this.worldcupRepository.getOne(worldcup_id);
    if (!worldcup) {
      const error = new Error();
      error.errorCode = 404;
      error.message = "월드컵 게시물이 존재하지 않습니다.";
      throw error;
    }
  };

  // 선택지 존재 확인
  choiceExistAssert = async (worldcup_choice_id) => {
    const worldcupChoice = await this.worldcupChoicesRepository.findOne(
      worldcup_choice_id
    );
    if (!worldcupChoice) {
      const error = new Error();
      error.errorCode = 404;
      error.message = "월드컵 선택지가 존재하지 않습니다.";
      throw error;
    }
  };
}

module.exports = WorldcupService;
