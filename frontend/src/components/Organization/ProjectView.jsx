import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ProjectCard from "../Project/ProjectCard";
import LoadingSpinner from "../common/LoadingSpinner";
import { message } from "antd";
import { IoMdSettings } from "react-icons/io";

// apis
import { useGetProjectsQuery } from "../../apis/projectApi";
import { useGetOrganizationQuery } from "../../apis/orgApi";
import EditOrganization from "./EditOrganization";
import NewProject from "../Project/NewProject";

const ProjectView = () => {
  const [skip, setSkip] = useState(useParams.orgId ? true : false);
  const projectList = [
    { title: "Project Management System 🔥", date: new Date() },
    { title: "Customer Management System", date: new Date() },
    { title: "Hospital Management System", date: new Date() },
    { title: "Student Management System", date: new Date() },
  ];
  // edit form
  const [addOrganization, setAddOrganization] = useState(false);
  const [addProject, setAddProject] = useState(false);
  // toast message
  const [messageApi, contextHandler] = message.useMessage();
  // const {isLoading, error, data} = useGetProjectsQuery({ userId: localStorage.getItem("user_id") ,orgId: useParams().orgId});
  const {
    isLoading,
    error,
    data: organization,
  } = useGetOrganizationQuery(useParams().orgId, { skip: skip });

  // load projects
  const {
    data: projects,
    error: projectError,
    isLoading: projectLoading,
  } = useGetProjectsQuery(useParams().orgId, localStorage.getItem("user_id"));

  // handling error for org query
  useEffect(() => {
    if (error) messageApi.error(error?.data.message);
    if (projectError) messageApi.error(projectError?.data.message);
  }, [isLoading, projectLoading]);
  return (
    <>
      {contextHandler}
      {isLoading === true ? (
        <LoadingSpinner />
      ) : (
        <div className="pt-5 px-3">
          <div className="is-flex is-justify-content-space-between is-align-items-center">
            <h1 className="title is-4">{organization?.data.org_name}</h1>
            <div className="is-flex is-gap-1 is-align-items-center">
              <button
                className="button is-primary"
                onClick={() => setAddProject(true)}
              >
                Add Project
              </button>
              <button
                className="button is-primary"
                onClick={() => setAddOrganization(true)}
              >
                <span class="icon is-medium is-clickable">
                  <IoMdSettings className="icon-2" />
                </span>
              </button>
            </div>
          </div>
          <div className="is-flex is-flex-wrap-wrap is-gap-2 border">
            {!projectLoading &&
              projects?.data.map((project, index) => {
                return (
                  <ProjectCard
                    key={index}
                    title={project.project_title}
                    date={project.created_date.slice(0, 10)}
                    id={project.project_id}
                  />
                );
              })}
          </div>
        </div>
      )}
      <EditOrganization
        data={organization?.data}
        isOpen={addOrganization}
        setIsOpen={setAddOrganization}
      />
      <NewProject isOpen={addProject} setIsOpen={setAddProject} />
    </>
  );
};

export default ProjectView;
