const { Worldcups, Worldcup_results, Users } = require("../models");

class WorldcupChoiceRepository {
  constructor(worldcupChoiceModel) {
    this.worldcupChoiceModel = worldcupChoiceModel;
  }

  findAllMine = async (user_id) => {
    const myWorldcupResults = await this.worldcupChoiceModel.findAll({
      include: [
        {
          model: Worldcups,
          attributes: ["title"],
        },
        {
          model: Worldcup_results,
          attributes: [],
          where: { user_id },
        },
      ],
      attributes: ['choice_name'],
    });
    const results = myWorldcupResults.map((result) => ({
      choice_name: result.choice_name,
      title: result.Worldcup.title,
    }));
    return results;
  };

  createChoice = async (worldcup_id, choice_name, choice_url) => {
    await this.worldcupChoiceModel.create({
      worldcup_id,
      choice_name,
      choice_url,
    });
  };

  createResult = async (worldcupResultData) => {
    await Worldcup_results.create(worldcupResultData);
  };

  findOne = async (worldcup_choice_id) => {
    return await this.worldcupChoiceModel.findOne({
      where: { worldcup_choice_id },
    });
  };

  increaseWinCount = async (worldcup_choice_id) => {
    await this.worldcupChoiceModel.increment("win_count", {
      by: 1,
      where: { worldcup_choice_id },
    });
  };

  findAllWorldcupChoices = async (worldcup_id) => {
    return await this.worldcupChoiceModel.findAll({
      order: [['win_count', 'DESC']],
      where: { worldcup_id },
    });
  };
}

module.exports = WorldcupChoiceRepository;
