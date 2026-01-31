const { News, User } = require('../models');
const { Op } = require('sequelize');

// 获取新闻列表
exports.getAll = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      category, 
      status,
      search,
      title
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    // 筛选条件
    if (category) where.category = category;
    // 只有当status有明确值时才添加筛选（不传或传空串则不筛选）
    if (status !== undefined && status !== '') {
      where.status = status;
    } else if (status === undefined) {
      // 如果完全不传status参数，默认只显示已发布的（前端网站使用）
      where.status = 'published';
    }
    // 如果传递空字符串，则不添加status筛选（管理后台使用）
    
    if (title) {
      where.title = { [Op.like]: `%${title}%` };
    }
    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { excerpt: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await News.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['publish_date', 'DESC'], ['created_at', 'DESC']],
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username']
      }]
    });

    res.json({
      success: true,
      data: {
        news: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取新闻列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// 获取单个新闻
exports.getOne = async (req, res) => {
  try {
    const { id } = req.params;
    
    const news = await News.findByPk(id, {
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username']
      }]
    });

    if (!news) {
      return res.status(404).json({
        success: false,
        message: '新闻不存在'
      });
    }

    // 增加浏览次数
    await news.increment('views');

    res.json({
      success: true,
      data: { news }
    });
  } catch (error) {
    console.error('获取新闻详情错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// 创建新闻
exports.create = async (req, res) => {
  try {
    const { title, category, excerpt, content, cover_image, badge, publish_date, status, attachments } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: '标题和内容不能为空'
      });
    }

    const news = await News.create({
      title,
      category,
      excerpt,
      content,
      cover_image,
      badge,
      publish_date: publish_date || new Date(),
      status: status || 'draft',
      author_id: req.user.id,
      attachments: attachments || null
    });

    res.status(201).json({
      success: true,
      message: '新闻创建成功',
      data: { news }
    });
  } catch (error) {
    console.error('创建新闻错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// 更新新闻
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, category, excerpt, content, cover_image, badge, publish_date, status, attachments } = req.body;

    const news = await News.findByPk(id);

    if (!news) {
      return res.status(404).json({
        success: false,
        message: '新闻不存在'
      });
    }

    await news.update({
      title: title || news.title,
      category: category || news.category,
      excerpt: excerpt !== undefined ? excerpt : news.excerpt,
      content: content || news.content,
      cover_image: cover_image !== undefined ? cover_image : news.cover_image,
      badge: badge !== undefined ? badge : news.badge,
      publish_date: publish_date || news.publish_date,
      status: status || news.status,
      attachments: attachments !== undefined ? attachments : news.attachments
    });

    res.json({
      success: true,
      message: '新闻更新成功',
      data: { news }
    });
  } catch (error) {
    console.error('更新新闻错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// 删除新闻
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    const news = await News.findByPk(id);

    if (!news) {
      return res.status(404).json({
        success: false,
        message: '新闻不存在'
      });
    }

    await news.destroy();

    res.json({
      success: true,
      message: '新闻删除成功'
    });
  } catch (error) {
    console.error('删除新闻错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};
