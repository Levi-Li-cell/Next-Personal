import { motion } from 'motion/react';
import { Award, Trophy, Star, Medal } from 'lucide-react';

const honors = [
  { title: '普通话二级乙等', icon: Award, highlight: false },
  { title: 'C1类驾驶执照', icon: Medal, highlight: false },
  { title: '二等奖学金', icon: Trophy, highlight: true },
  { title: '经开杯创新创业大赛金奖', icon: Trophy, highlight: true },
  { title: 'HarmonyOS应用开发高级认证', icon: Star, highlight: true },
];

export default function HonorGallery() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {honors.map((honor, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.8, rotateY: -180 }}
            whileInView={{ opacity: 1, scale: 1, rotateY: 0 }}
            viewport={{ once: true }}
            transition={{
              delay: index * 0.1,
              type: "spring",
              stiffness: 100
            }}
            whileHover={{
              scale: 1.05,
              rotateY: 10,
              rotateX: 5,
              transition: { duration: 0.2 }
            }}
            className={`relative bg-white/5 backdrop-blur-xl rounded-2xl p-6 border transition-all overflow-hidden group ${honor.highlight
                ? 'border-yellow-400/30 hover:border-yellow-400'
                : 'border-white/10 hover:border-white/30'
              }`}
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Shine Effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/10 to-white/0"
              animate={{
                x: ['-100%', '100%'],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                repeatDelay: 2,
              }}
            />

            {/* Content */}
            <div className="relative z-10">
              <motion.div
                className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${honor.highlight
                    ? 'bg-gradient-to-br from-yellow-400 to-orange-500'
                    : 'bg-gradient-to-br from-purple-500 to-blue-500'
                  }`}
                whileHover={{ scale: 1.2, rotate: 15 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <honor.icon className="w-8 h-8 text-white" />
              </motion.div>

              <h3 className="text-white text-center leading-relaxed mb-2">
                {honor.title}
              </h3>

              {honor.highlight && (
                <div className="flex justify-center">
                  <motion.div
                    className="flex gap-1"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ delay: index * 0.1 + 0.3 }}
                  >
                    {[...Array(3)].map((_, i) => (
                      <motion.div
                        key={i}
                        animate={{
                          scale: [1, 1.2, 1],
                          rotate: [0, 10, -10, 0],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          delay: i * 0.2,
                        }}
                      >
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              )}
            </div>

            {/* Corner Decoration */}
            {honor.highlight && (
              <>
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-yellow-400/20 to-transparent rounded-bl-full"></div>
                <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-orange-400/20 to-transparent rounded-tr-full"></div>
              </>
            )}
          </motion.div>
        ))}
      </div>

      {/* Self Evaluation */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.5 }}
        className="mt-12 bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10"
      >
        <h3 className="text-white text-2xl mb-6 text-center">
          <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            自我评价
          </span>
        </h3>

        <div className="grid md:grid-cols-2 gap-4">
          {[
            '本人性格踏实稳重，严谨务实、有较强的抗压能力',
            '设计上具备良好的审美能力，有良好的代码编程习惯',
            '注重代码质量和用户体验，善于从产品角度思考技术实现',
            '对前端技术有持续学习的热情，每周保持阅读技术博客和参与开源项目的习惯',
          ].map((text, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start gap-3 text-white/80"
            >
              <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-cyan-400 rounded-full mt-2"></div>
              <p className="flex-1">{text}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
