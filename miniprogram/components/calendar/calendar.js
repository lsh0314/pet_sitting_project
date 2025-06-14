Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 当前选中的日期，格式为YYYY-MM-DD
    selected: {
      type: String,
      value: ''
    },
    // 最小可选日期，格式为YYYY-MM-DD
    minDate: {
      type: String,
      value: ''
    },
    // 最大可选日期，格式为YYYY-MM-DD
    maxDate: {
      type: String,
      value: ''
    },
    // 日期样式配置
    daysColor: {
      type: Array,
      value: []
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    // 当前年份
    currentYear: new Date().getFullYear(),
    // 当前月份
    currentMonth: new Date().getMonth() + 1,
    // 当前日期
    currentDate: new Date().getDate(),
    // 日历数据
    days: [],
    // 星期几
    weekdays: ['日', '一', '二', '三', '四', '五', '六']
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 初始化日历
     */
    initCalendar() {
      const year = this.data.currentYear;
      const month = this.data.currentMonth;
      const days = this.calculateDays(year, month);
      this.setData({ days });
    },

    /**
     * 计算当前月的日期数据
     */
    calculateDays(year, month) {
      // 获取当前月的第一天是星期几
      const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
      // 获取当前月的天数
      const daysInMonth = new Date(year, month, 0).getDate();
      
      // 构建日期数组
      const days = [];
      
      // 添加上个月的日期
      const prevMonthDays = new Date(year, month - 1, 0).getDate();
      for (let i = 0; i < firstDayOfMonth; i++) {
        days.push({
          day: prevMonthDays - firstDayOfMonth + i + 1,
          month: 'prev',
          date: this.formatDate(year, month - 1, prevMonthDays - firstDayOfMonth + i + 1),
          isDisabled: true, // 上个月的日期默认禁用
          color: '#cccccc', // 灰色文字
          background: '#f5f5f5' // 灰色背景
        });
      }
      
      // 添加当前月的日期
      for (let i = 1; i <= daysInMonth; i++) {
        const date = this.formatDate(year, month, i);
        const isSelected = date === this.properties.selected;
        const isToday = this.isToday(year, month, i);
        
        // 检查是否在可选范围内
        let isDisabled = false;
        if (this.properties.minDate && date < this.properties.minDate) {
          isDisabled = true;
        }
        if (this.properties.maxDate && date > this.properties.maxDate) {
          isDisabled = true;
        }
        
        // 获取自定义样式
        const customStyle = this.getCustomStyle(i);
        
        days.push({
          day: i,
          month: 'current',
          date,
          isSelected,
          isToday,
          isDisabled,
          ...customStyle
        });
      }
      
      // 添加下个月的日期，补齐6行
      const totalDays = days.length;
      const remainingDays = 42 - totalDays; // 6行7列 = 42
      
      for (let i = 1; i <= remainingDays; i++) {
        days.push({
          day: i,
          month: 'next',
          date: this.formatDate(year, month + 1, i),
          isDisabled: true, // 下个月的日期默认禁用
          color: '#cccccc', // 灰色文字
          background: '#f5f5f5' // 灰色背景
        });
      }
      
      return days;
    },

    /**
     * 格式化日期为YYYY-MM-DD
     */
    formatDate(year, month, day) {
      // 处理跨年的情况
      if (month <= 0) {
        year -= 1;
        month = 12 + month;
      } else if (month > 12) {
        year += 1;
        month = month - 12;
      }
      
      return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    },

    /**
     * 检查是否是今天
     */
    isToday(year, month, day) {
      const today = new Date();
      return year === today.getFullYear() && month === today.getMonth() + 1 && day === today.getDate();
    },

    /**
     * 获取自定义样式
     */
    getCustomStyle(day) {
      const style = {};
      const daysColor = this.properties.daysColor || [];
      
      for (const item of daysColor) {
        if (item.month === 'current' && item.day === day) {
          style.color = item.color;
          style.background = item.background;
          break;
        }
      }
      
      return style;
    },

    /**
     * 点击日期
     */
    tapDay(e) {
      const index = e.currentTarget.dataset.index;
      const day = this.data.days[index];
      
      // 如果是上个月或下个月的日期，或者日期被禁用，则不响应点击
      if (day.month !== 'current' || day.isDisabled) {
        return;
      }
      
      // 更新选中状态
      const days = this.data.days.map((d, i) => {
        return {
          ...d,
          isSelected: i === index
        };
      });
      
      this.setData({ days });
      
      // 触发选择事件
      this.triggerEvent('select', {
        date: day.date,
        dateString: day.date
      });
    },

    /**
     * 上个月
     */
    prevMonth() {
      let { currentYear, currentMonth } = this.data;
      currentMonth -= 1;
      if (currentMonth <= 0) {
        currentYear -= 1;
        currentMonth = 12;
      }
      
      this.setData({
        currentYear,
        currentMonth
      });
      
      this.initCalendar();
      
      // 触发月份变更事件
      this.triggerEvent('monthChange', {
        year: currentYear,
        month: currentMonth
      });
    },

    /**
     * 下个月
     */
    nextMonth() {
      let { currentYear, currentMonth } = this.data;
      currentMonth += 1;
      if (currentMonth > 12) {
        currentYear += 1;
        currentMonth = 1;
      }
      
      this.setData({
        currentYear,
        currentMonth
      });
      
      this.initCalendar();
      
      // 触发月份变更事件
      this.triggerEvent('monthChange', {
        year: currentYear,
        month: currentMonth
      });
    }
  },

  /**
   * 组件生命周期
   */
  lifetimes: {
    attached() {
      this.initCalendar();
    }
  },

  /**
   * 监听属性变化
   */
  observers: {
    'selected, daysColor': function() {
      this.initCalendar();
    }
  }
}) 