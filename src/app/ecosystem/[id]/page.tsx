import { ecosystemService } from '@/services/ecosystem';
import { ProjectDetails } from '@/components/ecosystem/ProjectDetails';
import type { Project } from '@/services/ecosystem';
import { notFound } from 'next/navigation';

// This function runs at build time to generate all possible project pages
export async function generateStaticParams() {
  const projects = ecosystemService.getAllProjects();
  return projects.map((project: Project) => ({
    id: project.id,
  }));
}

// This function runs at build time for each project page
export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  // Pre-fetch the project data at build time
  const project = ecosystemService.getProjectById(params.id);
  
  if (!project) {
    notFound();
  }

  return <ProjectDetails id={params.id} project={project} />;
} 