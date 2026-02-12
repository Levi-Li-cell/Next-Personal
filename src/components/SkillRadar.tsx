import { motion } from 'motion/react';
import { Code, Smartphone, Database, GitBranch, Zap, Layers } from 'lucide-react';

const skills = [
  {
    category: '前端基础',
    icon: Code,
    items: ['HTML5', 'CSS3', 'JavaScript', 'ES6+', 'TypeScript'],
    level: 95,
    color: 'from-purple-500 to-pink-500'
  },
  {
    category: '框架技术',
    icon: Layers,
    items: ['Vue3', 'React', 'Uni-app', 'Element Plus', 'Ant Design'],
    level: 90,
    color: 'from-cyan-500 to-blue-500'
  },
  {
    category: '鸿蒙开发',
    icon: Smartphone,
    items: ['ArkUI', 'ArkTS', '端云一体化', '多端部署', 'Kit能力'],
    level: 88,
    color: 'from-pink-500 to-rose-500'
  },
  {
    category: '后端技能',
    icon: Database,
    items: ['Node.js', 'Express', 'MySQL', 'RESTful API'],
    level: 75,
    color: 'from-green-500 to-teal-500'
  },
  {
    category: '工程化',
    icon: GitBranch,
    items: ['Git', 'Webpack', 'Vite', 'CI/CD'],
    level: 85,
    color: 'from-yellow-500 to-orange-500'
  },
  {
    category: '性能优化',
    icon: Zap,
    items: ['懒加载', '代码分割', '缓存策略', '性能监控'],
    level: 82,
    color: 'from-indigo-500 to-purple-500'
  },
];

export default function SkillRadar() {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
      {skills.map((skill, index) => (
        <motion.div
          key={skill.category}
          initial={{ opacity: 0, y: 50, rotateX: -20 }}
          whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.1 }}
          whileHover={{
            scale: 1.05,
            rotateY: 5,
            transition: { duration: 0.2 }
          }}
          className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/30 transition-all group"
          style={{ transformStyle: 'preserve-3d' }}
        >
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-12 h-12 bg-gradient-to-br ${skill.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
              <skill.icon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-white text-xl">{skill.category}</h3>
          </div>

          <div className="space-y-3 mb-4">
            {skill.items.map((item, i) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 + i * 0.05 }}
                className="flex items-center gap-2 text-white/70 text-sm"
              >
                <div className="w-1.5 h-1.5 bg-gradient-to-r from-purple-400 to-cyan-400 rounded-full"></div>
                <span>{item}</span>
              </motion.div>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className={`h-full bg-gradient-to-r ${skill.color} rounded-full`}
              initial={{ width: 0 }}
              whileInView={{ width: `${skill.level}%` }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: index * 0.1 }}
            />
          </div>
          <p className="text-white/50 text-sm mt-2 text-right">熟练度: {skill.level}%</p>
        </motion.div>
      ))}
    </div>
  );
}
