const { Case } = require('../models');
const { Op } = require('sequelize');

// 获取案例列表
exports.getAll = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 12, 
      category,
      status = 'published',
      search 
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    if (category && category !== 'all') where.category = category;
    if (status) where.status = status;
    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Case.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['completion_date', 'DESC'], ['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        cases: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取案例列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// 获取单个案例
exports.getOne = async (req, res) => {
  try {
    const { id } = req.params;
    
    const caseItem = await Case.findByPk(id);

    if (!caseItem) {
      return res.status(404).json({
        success: false,
        message: '案例不存在'
      });
    }

    res.json({
      success: true,
      data: { case: caseItem }
    });
  } catch (error) {
    console.error('获取案例详情错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// 创建案例
exports.create = async (req, res) => {
  try {
    const { 
      title, 
      category, 
      area, 
      cost, 
      description, 
      content, 
      cover_image, 
      images, 
      tags, 
      completion_date,
      status 
    } = req.body;

    if (!title || !category) {
      return res.status(400).json({
        success: false,
        message: '标题和分类不能为空'
      });
    }

    const caseItem = await Case.create({
      title,
      category,
      area,
      cost,
      description,
      content,
      cover_image,
      images,
      tags,
      completion_date,
      status: status || 'draft'
    });

    res.status(201).json({
      success: true,
      message: '案例创建成功',
      data: { case: caseItem }
    });
  } catch (error) {
    console.error('创建案例错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// 更新案例
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const caseItem = await Case.findByPk(id);

    if (!caseItem) {
      return res.status(404).json({
        success: false,
        message: '案例不存在'
      });
    }

    await caseItem.update(updateData);

    res.json({
      success: true,
      message: '案例更新成功',
      data: { case: caseItem }
    });
  } catch (error) {
    console.error('更新案例错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// 删除案例
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    const caseItem = await Case.findByPk(id);

    if (!caseItem) {
      return res.status(404).json({
        success: false,
        message: '案例不存在'
      });
    }

    await caseItem.destroy();

    res.json({
      success: true,
      message: '案例删除成功'
    });
  } catch (error) {
    console.error('删除案例错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};
