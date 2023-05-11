const { Op } = require("sequelize");
const { Users, Worldcup_choices } = require("../models");
const { Sequelize } = require("sequelize");

class WorldcupRepository {
  constructor(WorldcupsModel) {
    this.worldcupsModel = WorldcupsModel;
  }

  create = async (user_id, title, content) => {
    return await this.worldcupsModel.create({ user_id, title, content });
  };

  getAll = async () => {
    return await this.worldcupsModel.findAll({
      include: [
        {
          model: Users,
          attributes: [],
          required: true,
        },
      ],
      attributes: [
        "worldcup_id",
        "user_id",
        "title",
        "content",
        "play_count",
        "likes",
        [Sequelize.literal("`User`.`nickname`"), "nickname"],
        "createdAt",
        "updatedAt",
      ],
      group: ["Worldcups.worldcup_id"],
      order: [["createdAt", "DESC"]],
    });
  };

  getOne = async (worldcup_id) => {
    return await this.worldcupsModel.findOne({
      include: [
        {
          model: Worldcup_choices,
          attributes: ["choice_name", "choice_url", "worldcup_choice_id"],
          required: true,
        },
        {
          model: Users,
          attributes: [],
          required: true,
        },
      ],
      attributes: [
        "worldcup_id",
        "user_id",
        "title",
        "content",
        "play_count",
        "likes",
        [Sequelize.literal("`User`.`nickname`"), "nickname"],
        "createdAt",
        "updatedAt",
      ],
      where: { worldcup_id },
    });
  };

  update = async (title, content, worldcup_id, user_id) => {
    await this.worldcupsModel.update(
      { title, content },
      { where: { [Op.and]: [{ worldcup_id }, { user_id }] } }
    );
  };

  remove = async (worldcup_id, user_id) => {
    await this.worldcupsModel.destroy({
      where: { [Op.and]: [{ worldcup_id }, { user_id }] },
    });
  };

  findAll = async (user_id) => {
    const posts = await this.worldcupsModel.findAll({
      where: { user_id },
      include: [
        {
          model: Worldcup_choices,
          attributes: ["choice_name", "choice_url", "win_count"],
          required: true,
          order: [["win_count", "DESC"]],
          limit: 2,
        },
      ],
    });
    return posts;
  };

  decreaseLikes = async (worldcup_id) => {
    const findLikesData = await this.worldcupsModel.findOne({
      where: { worldcup_id },
    });

    const decreaseLikesData = await findLikesData.decrement("likes", { by: 1 });
    return decreaseLikesData;
  };

  increaseLikes = async (worldcup_id) => {
    const findLikesData = await this.worldcupsModel.findOne({
      where: { worldcup_id },
    });

    const increaseLikesData = await findLikesData.increment("likes", { by: 1 });
    return increaseLikesData;
  };
}

module.exports = WorldcupRepository;
