const Review = require('../models/review.model')
const { formatDate } = require('../utils/helpers')

class ReviewController {
  /**
   * 获取评价列表
   */
  static async getReviewList(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query
      const skip = (page - 1) * limit

      const { data, total } = await Review.find({ 
        page: Number(page), 
        limit: Number(limit) 
      })
      const reviews = data

      res.json({
        success: true,
        data: {
          data: reviews,
          total
        }
      })
    } catch (err) {
      console.error('获取评价列表失败:', err)
      res.status(500).json({
        success: false,
        message: '获取评价列表失败'
      })
    }
  }

  /**
   * 搜索评价
   */
  static async searchReviews(req, res) {
    try {
      const { keyword, min_rating, max_rating, is_anonymous, page = 1, limit = 10 } = req.query;

      console.log('收到搜索请求，原始参数:', req.query);

      // 将处理后的参数直接传递给模型层
      // 模型层会负责处理 undefined, 空字符串等情况
      const { data, total } = await Review.search({
        keyword,
        min_rating,
        max_rating,
        is_anonymous,
        page,
        limit,
      });

    res.json({
      success: true,
      data: {
        data, // data 字段通常就是查询结果数组
        total,
      },
    });
  } catch (err) {
    console.error('搜索评价失败:', err);
    res.status(500).json({
      success: false,
      message: '搜索评价失败',
    });
  }
}
  /**
   * 获取评价详情
   */
  static async getReviewDetail(req, res) {
    try {
      const review = await Review.findById(req.params.id)

      if (!review) {
        return res.status(404).json({
          success: false,
          message: '评价不存在'
        })
      }

      res.json({
        success: true,
        data: review
      })
    } catch (err) {
      console.error('获取评价详情失败:', err)
      res.status(500).json({
        success: false,
        message: '获取评价详情失败'
      })
    }
  }

  /**
   * 删除评价
   */
  static async deleteReview(req, res) {
    try {
      const success = await Review.findByIdAndDelete(req.params.id)
      if (!success) {
        return res.status(404).json({
          success: false,
          message: '评价不存在'
        })
      }

      res.json({
        success: true,
        message: '评价删除成功'
      })
    } catch (err) {
      console.error('删除评价失败:', err)
      res.status(500).json({
        success: false,
        message: '删除评价失败'
      })
    }
  }

  /**
   * 回复评价
   */
  static async updateReview(req, res) {
    try {
      const { comment } = req.body
      if (!comment) {
        return res.status(400).json({
          success: false,
          message: '评价内容不能为空'
        })
      }

      const review = await Review.findByIdAndUpdate(req.params.id, { 
        comment
      })

      if (!review) {
        return res.status(404).json({
          success: false,
          message: '评价不存在'
        })
      }

      res.json({
        success: true,
        message: '更新成功',
        data: review
      })
    } catch (err) {
      console.error('更新评价失败:', err)
      res.status(500).json({
        success: false,
        message: '更新评价失败'
      })
    }
  }

  /**
   * 导出评价数据
   */
  static async exportReviews(req, res) {
    try {
      const { min_rating, max_rating } = req.query

      const query = {}
      if (min_rating) query.rating = { $gte: Number(min_rating) }
      if (max_rating) query.rating = { ...query.rating, $lte: Number(max_rating) }

      const { data } = await Review.search({ 
        min_rating, 
        max_rating 
      })
      const reviews = data

      // 生成CSV内容
      let csvContent = '评价ID,订单号,用户昵称,帮溜员昵称,评分,评价内容,评价时间\n'
      
      reviews.forEach(review => {
        csvContent += `"${review.id}","${review.order_no || ''}","${review.reviewer_nickname || ''}",` +
          `"${review.reviewee_nickname || ''}","${review.rating}","${review.comment?.replace(/"/g, '""') || ''}",` +
          `"${formatDate(review.created_at)}"\n`
      })

      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', 'attachment; filename=reviews_export.csv')
      res.send(csvContent)
    } catch (err) {
      console.error('导出评价失败:', err)
      res.status(500).json({
        success: false,
        message: '导出评价失败'
      })
    }
  }

  /**
   * 切换评价显示状态
   */
  static async toggleVisibility(req, res) {
    try {
      const { id } = req.params;
      const result = await Review.toggleVisibility(id);
      
      if (!result.success) {
        return res.status(404).json({
          success: false,
          message: '评价不存在'
        });
      }

      res.json({
        success: true,
        data: {
          is_anonymous: result.is_anonymous
        }
      });
    } catch (err) {
      console.error('切换显示状态失败:', err);
      res.status(500).json({
        success: false,
        message: '切换显示状态失败'
      });
    }
  }
}

module.exports = ReviewController
