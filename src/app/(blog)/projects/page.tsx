"use client";

import { motion } from 'motion/react';
import { Folder, ExternalLink, Github, Loader2, ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Project {
  id: string;
  title: string;
  description: string;
  techStack: string[];
  demoUrl: string | null;
  githubUrl: string | null;
  coverImage: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface ProjectResponse {
  success: boolean;
  data: Project[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProjects() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/projects');
        const data: ProjectResponse = await response.json();
        
        if (data.success) {
          setProjects(data.data);
        } else {
          setError('获取项目列表失败');
        }
      } catch (err) {
        setError('网络错误，请稍后重试');
        console.error('获取项目列表失败:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, []);

  return (
    <div className="container mx-auto px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
            项目作品
          </span>
        </h1>
        <p className="text-white/60 text-lg">我参与开发的一些项目</p>
      </motion.div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
          <span className="ml-3 text-white/60">加载中...</span>
        </div>
      ) : error ? (
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-6 text-center">
          <p className="text-red-400">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md text-white transition-colors"
          >
            重试
          </button>
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-white/60">暂无项目</p>
        </div>
      ) : (
        <div className="columns-1 md:columns-2 lg:columns-3 gap-6 [column-fill:_balance]">
          {projects.map((project, index) => (
            <Link key={project.id} href={`/projects/${project.id}`} className="mb-6 block break-inside-avoid">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:border-purple-500/50 transition-all overflow-hidden"
                whileHover={{ y: -5 }}
              >
                {project.coverImage && (
                  <div className="overflow-hidden border-b border-white/10">
                    <img
                      src={project.coverImage}
                      alt={project.title}
                      className="w-full h-40 object-cover object-top"
                    />
                  </div>
                )}
                <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`flex items-center gap-4 ${!project.coverImage ? 'w-full' : ''}`}>
                    {!project.coverImage && (
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Folder className="w-6 h-6 text-white" />
                      </div>
                    )}
                    {!project.coverImage && (
                      <h2 className="text-xl font-semibold text-white group-hover:text-purple-300 transition-colors flex-grow">
                        {project.title}
                      </h2>
                    )}
                  </div>
                  <div className="flex gap-3">
                    {project.githubUrl && (
                      <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="text-white hover:text-white transition-colors" onClick={(e) => e.stopPropagation()}>
                        <Github className="w-5 h-5" />
                      </a>
                    )}
                    {project.demoUrl && (
                      <a href={project.demoUrl} target="_blank" rel="noopener noreferrer" className="text-white hover:text-white transition-colors" onClick={(e) => e.stopPropagation()}>
                        <ExternalLink className="w-5 h-5" />
                      </a>
                    )}
                    <ArrowRight className="w-5 h-5 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
                {project.coverImage && (
                  <h2 className="text-xl font-semibold text-white mb-3 group-hover:text-purple-300 transition-colors">
                    {project.title}
                  </h2>
                )}
                <p className="text-white text-sm mb-4">
                  {project.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {project.techStack.map((tech) => (
                    <span
                      key={tech}
                      className="px-3 py-1 text-xs bg-purple-500/20 text-purple-300 rounded-full"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
