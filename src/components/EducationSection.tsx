import { motion } from 'motion/react';
import { GraduationCap, Calendar, BookOpen } from 'lucide-react';

const courses = [
  'HTML5 程序设计',
  '微信小程序开发',
  '基于HarmonyOs的移动智能终端应用开发',
  'C++语言程序设计',
  'Python语言程序设计',
  '数据结构',
  'MySQL数据库原理',
  '计算机组成原理',
  '嵌入式原理',
  '神经网络和深度学习'
];

export default function EducationSection() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      className="max-w-4xl mx-auto"
    >
      <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 hover:border-green-400/50 transition-all">
        <div className="flex flex-wrap items-center gap-6 mb-8 pb-6 border-b border-white/10">
          <motion.div
            className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-500 rounded-2xl flex items-center justify-center"
            whileHover={{ scale: 1.1, rotate: 5 }}
          >
            <GraduationCap className="w-8 h-8 text-white" />
          </motion.div>

          <div className="flex-1">
            <h3 className="text-white text-3xl mb-2">南昌交通学院</h3>
            <div className="flex flex-wrap gap-4 text-white/70">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>2021.9 - 2025.6</span>
              </div>
              <div className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm">
                智能科技
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-2 text-white mb-4">
            <BookOpen className="w-5 h-5" />
            <h4 className="text-xl">主修课程</h4>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {courses.map((course, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.05, x: 5 }}
              className="flex items-center gap-3 bg-white/5 backdrop-blur-sm px-4 py-3 rounded-xl border border-white/10 hover:border-green-400/50 transition-all group"
            >
              <motion.div
                className="w-2 h-2 bg-gradient-to-r from-green-400 to-teal-400 rounded-full"
                whileHover={{ scale: 1.5 }}
              />
              <span className="text-white/80 group-hover:text-white transition-colors">
                {course}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
