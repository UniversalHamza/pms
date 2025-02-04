require("dotenv").config({ path: "../.env" });
const User = require("../models/user.model");
const Organization = require("../models/organization.model");
const Project = require("../models/project.model");
const jwt = require("jsonwebtoken");
const { delay } = require("../utils/delay");
const { sendNotificationEmail } = require("../utils/sendEmail");

exports.addProject = async (req, res, next) => {
  try {
    const orgId = req.params.orgId;
    console.log(req.params);
    const { email, projectTitle } = req.body;

    // check
    if (orgId === "" || email === "" || projectTitle === "")
      return res.json({
        success: false,
        message: "required data not provided",
      });

    if (projectTitle.length <= 2)
      return res.status(500).json({
        success: false,
        message: "Project name must contains 3 characters",
      });

    const [user, _] = await User.findByEmailId(email);
    // check, if we have any user with this email
    if (user.length <= 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found!" });
    }
    const currentDate = new Date();
    console.log(orgId);
    // create new project
    const project = new Project(
      orgId,
      user[0].user_id,
      projectTitle,
      currentDate
    );

    project.save();

    return res.status(201).json({
      success: true,
      message: "project created successfully!",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error?.message });
  }
};

exports.getProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const [project, _] = await Project.findByProjectId(projectId);
    return res.status(200).json({ success: true, data: project[0] });
  } catch (error) {
    return res.status(500).json({ success: false, message: error?.message });
  }
};

exports.getProjects = async (req, res, next) => {
  try {
    const { orgId, userId } = req.params;
    const [projects, _] = await Project.findByUserId(orgId, userId);
    if (projects.length <= 0)
      return res
        .status(404)
        .json({ success: false, message: "You don't have any projects yet" });

    return res.status(200).json({
      success: true,
      data: projects,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateProject = async (req, res, next) => {
  try {
    const { projectId, ownerId } = req.params;
    const { description, projectTitle } = req.body;
    // check
    if (projectTitle === "")
      return res.json({
        success: false,
        message: "required data not provided",
      });

    const [user, __] = await User.findByUserId(ownerId);
    // check, if we have any user with this email
    if (user.length <= 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found!" });
    }

    const [project, _] = await Project.findByProjectId(projectId);
    // check, if we have any project with this id
    if (project.length <= 0) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found!" });
    }

    if (project[0].project_owner != ownerId) {
      return res.status(401).json({
        success: false,
        message: "Only project owner or admin can make changes",
      });
    }

    Project.updateProject(description, projectTitle, projectId);
    return res.status(201).json({
      success: true,
      message: "project updated successfully",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error?.message });
  }
};

exports.deleteProject = async (req, res, next) => {
  try {
    const { projectId, ownerId } = req.params;
    const [user, __] = await User.findByUserId(ownerId);
    // check, if we have any user with this email
    if (user.length <= 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found!" });
    }

    const [project, _] = await Project.findByProjectId(projectId);
    // check, if we have any project with this id
    if (project.length <= 0) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found!" });
    }

    if (project[0].project_owner != user[0].user_id) {
      return res
        .status(404)
        .json({ success: false, message: "Only owner can delete the project" });
    }

    // if delete operairon is performed by onwer or some other user
    Project.deleteProject(ownerId, projectId);
    return res.status(201).json({
      success: true,
      message: "project deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error?.message });
  }
};

// add member
exports.addMember = async (req, res, next) => {
  try {
    // get projectId and UserId
    const { projectId, userId } = req.params;
    const { email } = req.body;

    const [invitedby, ____] = await User.findByUserId(userId);
    // send invitation email to new member
    if (invitedby.length <= 0) {
      return res.status(401).json({
        success: false,
        message: `You're not register on Taskify`,
      });
    }
    // now select project
    const [project, __] = await Project.findByProjectId(projectId);
    if (project.length <= 0) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }

    // only owner can add member
    if (project[0].project_owner != invitedby[0].user_id) {
      return res.status(404).json({
        success: false,
        message: "you're not authorized to add members",
      });
    }

    // check if any user exist with the given email
    const [user, _] = await User.findByEmailId(email);
    if (user.length <= 0) {
      // send email to given email address
      sendNotificationEmail(
        email,
        "Hello,",
        `${invitedby[0].first_name} ${invitedby[0].last_name} invited you to join ${project[0].project_title} on Taskify.
        To join ${project[0].project_title}, use this join code ${project[0].joining_code}
        To register, click on the following link: http://localhost:5173/signup
        `
      );
      return res.json({
        success: true,
        message: `Invitation email is sent to ${email}`,
      });
    }

    //   // owner can not be added as member
    if (project[0].project_owner == user[0].user_id) {
      return res.json({
        success: false,
        message: "you cannot add project owner as member",
      });
    }

    // check if user already member
    const [isMember, ___] = await Project.isAlreadyMember(
      projectId,
      user[0].user_id
    );
    console.log(isMember);
    if (isMember.length > 0) {
      return res.status(40).json({
        success: false,
        message: `${user[0].first_name} ${user[0].last_name} is already a member`,
      });
    }
    console.log(invitedby, project, user);

    // add member
    await Project.addMember(projectId, user[0].user_id);

    sendNotificationEmail(
      email,
      `Hi ${user[0].first_name} ${user[0].last_name}`,
      `${invitedby[0].first_name} ${invitedby[0].last_name} invited you to join ${project[0].project_title} on Taskify.
        To join ${project[0].project_title}, use this join code ${project[0].joining_code}
        To sign, click on the following link: http://localhost:5173/signin
      `
    );

    return res
      .status(201)
      .json({ success: true, message: `Join code sent to ${email}` });
  } catch (error) {
    return res.status(500).json({ success: false, message: error?.message });
  }
};

exports.joinProject = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const { joiningCode } = req.body;
    console.log(userId, joiningCode);

    // check user exist or not
    const [user, _] = await User.findByUserId(userId);
    if (user[0].length <= 0) {
      return res.status(40).json({
        success: false,
        message: "You're not registered",
      });
    }

    // select project
    const [project, __] = await Project.findByJoiningCode(joiningCode);
    if (project.length <= 0) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }

    // check which organization this project belongs to
    const [org, ___] = await Organization.findByOrganizationID(
      project[0].project_org_id
    );
    if (org.length <= 0) {
      return res
        .status(404)
        .json({ success: false, message: "Organization not found" });
    }

    // check if user is a member of this organization or not
    const [orgMember, ____] = await Organization.findByMemberAndOrganizationId(
      org[0].org_id,
      userId
    );
    if (orgMember.length <= 0) {
      return res
        .status(404)
        .json({
          success: false,
          message: "User is not member of this organization",
        });
    }
    console.log(orgMember);

    // add member
    await Project.joinProject(joiningCode, userId);

    // send notification email to organization owner
    const [owner, _____] = await User.findByUserId(org[0].org_owner);
    const [member, _fileds] = await User.findByUserId(userId);
    sendNotificationEmail(
      owner[0].email,
      `${org[0].org_name} Notification`,
      `Hi ${owner[0].first_name} ${owner[0].last_name}
    ${member[0].first_name} ${member[0].last_name} joined the ${project[0].project_title}
    `,
      res
    );

    return res
      .status(201)
      .json({ success: true, message: `User joined the project` });
  } catch (error) {
    return res.status(500).json({ success: false, message: error?.message });
  }
};

exports.getMembers = async (req, res, next) => {
  try {
    // find project
    const [project, _] = await Project.findByProjectId(req.params.projectId);
    if (project.length <= 0) {
      return res.status(404).json({
        success: false,
        message: "Project doesn't exist",
      });
    }

    // get members
    const [members, __] = await Project.getMembers(req.params.projectId);
    return res.status(200).json({ success: true, data: members });
  } catch (error) {
    return res.status(500).json({ success: false, message: error?.message });
  }
};

exports.removeMember = async (req, res, next) => {
  try {
    const { projectId, memberId, userId } = req.params;
    // find org by id
    const [project, _] = await Project.findByProjectId(projectId);
    if (project.length <= 0) {
      return res.status(404).json({
        success: false,
        message: "organization doesn't exist",
      });
    }
    console.log(projectId, memberId, userId, project)

    // only org owner can add or remove members
    if (project[0].project_owner != userId) {
      return res.status(404).json({
        success: false,
        message: "only owner can remove members",
      });
    }

    // check member exist or not
    const [found, __] = await Project.findByMemberAndProjectId(
      projectId,
      memberId
    );
    if (found.length <= 0) {
      return res.status(404).json({
        success: false,
        message: "member not found",
      });
    }

    // remove member
    await Project.removeMember(projectId, memberId);

    return res
      .status(200)
      .json({ success: true, message: "member removed successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error?.message });
  }
};
