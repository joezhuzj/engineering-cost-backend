const { Contact } = require('../models');
const { Op } = require('sequelize');

// 提交联系表单（公开接口）
exports.submit = async (req, res) => {
  try {
    const { name, phone, email, company, subject, message } = req.body;

    // 验证必填字段
    if (!name || !phone || !message) {
      return res.status(400).json({
        success: false,
        message: '姓名、电话和留言内容不能为空'
      });
    }

    // 获取IP地址
    const ip_address = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    const contact = await Contact.create({
      name,
      phone,
      email,
      company,
      subject,
      message,
      ip_address,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: '提交成功，我们会尽快与您联系',
      data: { contact: { id: contact.id } }
    });
  } catch (error) {
    console.error('提交联系表单错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// 获取联系记录列表（管理员）
exports.getAll = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status,
      search 
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    if (status) where.status = status;
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
        { company: { [Op.like]: `%${search}%` } },
        { message: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Contact.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        contacts: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取联系记录列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// 获取单个联系记录（管理员）
exports.getOne = async (req, res) => {
  try {
    const { id } = req.params;
    
    const contact = await Contact.findByPk(id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: '联系记录不存在'
      });
    }

    res.json({
      success: true,
      data: { contact }
    });
  } catch (error) {
    console.error('获取联系记录详情错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// 更新联系记录状态（管理员）
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const contact = await Contact.findByPk(id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: '联系记录不存在'
      });
    }

    await contact.update({
      status: status || contact.status,
      notes: notes !== undefined ? notes : contact.notes
    });

    res.json({
      success: true,
      message: '更新成功',
      data: { contact }
    });
  } catch (error) {
    console.error('更新联系记录错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// 删除联系记录（管理员）
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    const contact = await Contact.findByPk(id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: '联系记录不存在'
      });
    }

    await contact.destroy();

    res.json({
      success: true,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除联系记录错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// 获取统计数据（管理员）
exports.getStats = async (req, res) => {
  try {
    const total = await Contact.count();
    const pending = await Contact.count({ where: { status: 'pending' } });
    const processed = await Contact.count({ where: { status: 'processed' } });
    const archived = await Contact.count({ where: { status: 'archived' } });

    res.json({
      success: true,
      data: {
        stats: {
          total,
          pending,
          processed,
          archived
        }
      }
    });
  } catch (error) {
    console.error('获取统计数据错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};
