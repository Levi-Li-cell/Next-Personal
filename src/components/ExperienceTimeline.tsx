import { motion } from 'motion/react';
import { Building2, Calendar, ChevronRight } from 'lucide-react';
import { useState } from 'react';

const experiences = [
  {
    period: '2025.1 - 2025.5',
    company: '合肥宝德网络科技有限公司',
    position: '前端工程师',
    project: '健康云管家',
    techStack: ['微信小程序', 'uniapp', 'Git', 'Axios', 'MySQL', 'Express', 'Google Gemini AI'],
    description: '健康云管家是一套完整的智能健康管理平台，采用微信小程序技术栈，实现了症状记录、AI健康分析、健康档案管理和健康警示等核心功能。',
    responsibilities: [
      '使用Vue 3和uniapp构建跨平台响应式用户界面，实现症状记录、健康档案和个人中心等核心功能模块',
      '基于Express.js 框架设计RESTful API，实现用户认证、数据存储和业务逻辑处理',
      '集成Google Gemini 2.5 Flash AI 模型，实现智能症状分析和健康建议生成功能',
      '使用JWT实现用户认证系统，确保用户数据安全和隐私保护',
      '基于axios和自定义适配器实现跨平台HTTP请求处理，解决小程序兼容性问题',
      '使用Git进行版本控制，参与制定团队代码规范，确保代码质量和项目进度',
      '负责小程序的性能优化，减少页面加载时间，提升用户体验'
    ],
    color: 'from-purple-500 to-pink-500'
  },
  {
    period: '2024.9 - 2025.1',
    company: '合肥宝德网络科技有限公司',
    position: '前端工程师',
    project: '一杆云枢',
    techStack: ['Vue 3', 'Element Plus', 'ECharts', 'Node.js', 'MySQL', 'Git'],
    description: '一杆云枢是一套完整的台球场馆管理系统，采用前后端分离架构，实现了台球桌预订、会员管理、订单处理和数据统计等核心功能。',
    responsibilities: [
      '使用Vue 3和Element Plus构建响应式用户界面，实现台球桌预订、订单管理和个人中心等核心功能模块',
      '基于Node.js和Express框架设计RESTful API，实现用户认证、数据存储和业务逻辑处理',
      '设计并实现用户、订单、台球桌等数据模型，优化查询性能',
      '集成JWT认证机制，实现密码加密存储和权限控制系统',
      '使用ECharts实现营业数据统计和图表展示功能',
      '编写完整的部署文档，实现系统的环境配置和上线部署'
    ],
    color: 'from-cyan-500 to-blue-500'
  },
  {
    period: '2024.6 - 2024.8',
    company: '江西幻云信息有限公司',
    position: '鸿蒙开发工程师',
    project: '锋码集',
    techStack: ['ArkTS', 'AVPlayer', '卡片等Kit能力', 'RDB数据库', 'Axios', '端云一体化开发'],
    description: '此项目是一款面向开发者的技能提升平台，为用户提供全面的技术学习和实践环境，包括首页、项目、技术文章和个人中心四大模块。',
    responsibilities: [
      '负责应用整体架构设计和UI界面实现，确保良好的用户体验和交互效果',
      '使用ArkTS语言开发多个功能模块，包括首页推荐、项目展示、面经浏览和个人中心',
      '实现录音功能模块，解决音频录制、存储和播放的技术难点，提升用户学习效率',
      '开发单词学习功能，集成AVPlayer实现发音播放，帮助用户掌握开发常用词汇',
      '二次封装Axios请求工具和日志系统，优化数据获取流程和错误定位能力',
      '设计并实现应用卡片服务，提供便捷的信息获取渠道'
    ],
    color: 'from-pink-500 to-rose-500'
  },
];

export default function ExperienceTimeline() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500 via-pink-500 to-cyan-500"></div>

        <div className="space-y-8">
          {experiences.map((exp, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              className="relative pl-20"
            >
              {/* Timeline Dot */}
              <motion.div
                className={`absolute left-6 top-6 w-5 h-5 bg-gradient-to-br ${exp.color} rounded-full border-4 border-black`}
                whileHover={{ scale: 1.5 }}
              />

              {/* Card */}
              <motion.div
                className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden hover:border-white/30 transition-all"
                whileHover={{ scale: 1.02 }}
              >
                {/* Header */}
                <div
                  className="p-6 cursor-pointer"
                  onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <h3 className="text-white text-2xl mb-2">{exp.project}</h3>
                      <div className="flex flex-wrap gap-3 text-sm">
                        <div className="flex items-center gap-2 text-purple-300">
                          <Calendar className="w-4 h-4" />
                          <span>{exp.period}</span>
                        </div>
                        <div className="flex items-center gap-2 text-cyan-300">
                          <Building2 className="w-4 h-4" />
                          <span>{exp.company}</span>
                        </div>
                      </div>
                    </div>
                    <motion.div
                      animate={{ rotate: expandedIndex === index ? 90 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ChevronRight className="w-6 h-6 text-white/50" />
                    </motion.div>
                  </div>

                  <div className="inline-block px-3 py-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full text-purple-300 text-sm mb-4">
                    {exp.position}
                  </div>

                  <p className="text-white/70 leading-relaxed">{exp.description}</p>
                </div>

                {/* Expandable Content */}
                <motion.div
                  initial={false}
                  animate={{
                    height: expandedIndex === index ? 'auto' : 0,
                    opacity: expandedIndex === index ? 1 : 0
                  }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-6 space-y-4">
                    {/* Tech Stack */}
                    <div>
                      <p className="text-white/50 text-sm mb-2">技术栈</p>
                      <div className="flex flex-wrap gap-2">
                        {exp.techStack.map((tech) => (
                          <span
                            key={tech}
                            className="px-3 py-1 bg-white/10 rounded-full text-white/80 text-sm"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Responsibilities */}
                    <div>
                      <p className="text-white/50 text-sm mb-3">项目职责</p>
                      <ul className="space-y-2">
                        {exp.responsibilities.map((resp, i) => (
                          <motion.li
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="flex items-start gap-2 text-white/70 text-sm"
                          >
                            <span className="text-cyan-400 mt-1">•</span>
                            <span>{resp}</span>
                          </motion.li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
