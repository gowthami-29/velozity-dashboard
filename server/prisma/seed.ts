import bcrypt from "bcrypt";
import prisma from "../src/utils/prisma.js";

const PASSWORD = "password123";

async function main() {
  console.log("Starting database seed...");

  const hashedPassword = await bcrypt.hash(PASSWORD, 10);

  // --------------------------------------------------
  // CLEAN EXISTING DATA
  // --------------------------------------------------

  await prisma.notification.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.client.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  // --------------------------------------------------
  // USERS
  // --------------------------------------------------

  const admin = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@velozity.com",
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  const pm1 = await prisma.user.create({
    data: {
      name: "Project Manager One",
      email: "pm1@velozity.com",
      password: hashedPassword,
      role: "PROJECT_MANAGER",
    },
  });

  const pm2 = await prisma.user.create({
    data: {
      name: "Project Manager Two",
      email: "pm2@velozity.com",
      password: hashedPassword,
      role: "PROJECT_MANAGER",
    },
  });

  const developers = await Promise.all(
    [
      ["Developer One", "dev1@velozity.com"],
      ["Developer Two", "dev2@velozity.com"],
      ["Developer Three", "dev3@velozity.com"],
      ["Developer Four", "dev4@velozity.com"],
    ].map(([name, email]) =>
      prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: "DEVELOPER",
        },
      })
    )
  );

  console.log("Users created.");

  // --------------------------------------------------
  // CLIENTS
  // --------------------------------------------------

  const client1 = await prisma.client.create({
    data: {
      name: "ABC Technologies",
    },
  });

  const client2 = await prisma.client.create({
    data: {
      name: "HealthCare Solutions",
    },
  });

  const client3 = await prisma.client.create({
    data: {
      name: "FinTech Innovations",
    },
  });

  // --------------------------------------------------
  // PROJECTS
  // --------------------------------------------------

  const project1 = await prisma.project.create({
    data: {
      name: "Healthcare Dashboard",
      description: "Real-time healthcare management dashboard",
      clientId: client1.id,
      managerId: pm1.id,
    },
  });

  const project2 = await prisma.project.create({
    data: {
      name: "Finance Management Platform",
      description: "Financial tracking and reporting platform",
      clientId: client2.id,
      managerId: pm1.id,
    },
  });

  const project3 = await prisma.project.create({
    data: {
      name: "E-Commerce Platform",
      description: "Modern e-commerce application",
      clientId: client3.id,
      managerId: pm2.id,
    },
  });

  // --------------------------------------------------
  // TASK CREATION HELPER
  // --------------------------------------------------

  const createTask = async (
    projectId: string,
    developerId: string,
    title: string,
    status: "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE",
    priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
    dueDate: Date
  ) => {
    return prisma.task.create({
      data: {
        title,
        description: `${title} implementation task`,
        projectId,
        developerId,
        status,
        priority,
        dueDate,
      },
    });
  };

  const now = new Date();

  const overdue1 = new Date(now);
  overdue1.setDate(overdue1.getDate() - 5);

  const overdue2 = new Date(now);
  overdue2.setDate(overdue2.getDate() - 3);

  const future1 = new Date(now);
  future1.setDate(future1.getDate() + 5);

  const future2 = new Date(now);
  future2.setDate(future2.getDate() + 10);

  const future3 = new Date(now);
  future3.setDate(future3.getDate() + 15);

  // --------------------------------------------------
  // PROJECT 1 TASKS
  // --------------------------------------------------

  const project1Tasks = await Promise.all([
    createTask(
      project1.id,
      developers[0].id,
      "Build Login Page",
      "DONE",
      "HIGH",
      future1
    ),

    createTask(
      project1.id,
      developers[1].id,
      "Create Patient Dashboard",
      "IN_PROGRESS",
      "HIGH",
      future2
    ),

    createTask(
      project1.id,
      developers[0].id,
      "Implement Patient API",
      "TODO",
      "MEDIUM",
      overdue1
    ),

    createTask(
      project1.id,
      developers[2].id,
      "Add Patient Search",
      "IN_REVIEW",
      "MEDIUM",
      future3
    ),

    createTask(
      project1.id,
      developers[1].id,
      "Create Reports Module",
      "TODO",
      "CRITICAL",
      future2
    ),
  ]);

  // --------------------------------------------------
  // PROJECT 2 TASKS
  // --------------------------------------------------

  const project2Tasks = await Promise.all([
    createTask(
      project2.id,
      developers[2].id,
      "Build Finance Dashboard",
      "IN_PROGRESS",
      "HIGH",
      future1
    ),

    createTask(
      project2.id,
      developers[3].id,
      "Create Expense API",
      "TODO",
      "MEDIUM",
      future2
    ),

    createTask(
      project2.id,
      developers[2].id,
      "Add Budget Module",
      "IN_REVIEW",
      "HIGH",
      future3
    ),

    createTask(
      project2.id,
      developers[3].id,
      "Implement Transactions",
      "DONE",
      "CRITICAL",
      future1
    ),

    createTask(
      project2.id,
      developers[2].id,
      "Fix Payment Integration",
      "IN_PROGRESS",
      "HIGH",
      overdue2
    ),
  ]);

  // --------------------------------------------------
  // PROJECT 3 TASKS
  // --------------------------------------------------

  const project3Tasks = await Promise.all([
    createTask(
      project3.id,
      developers[0].id,
      "Build Product Page",
      "TODO",
      "HIGH",
      future1
    ),

    createTask(
      project3.id,
      developers[3].id,
      "Create Shopping Cart",
      "IN_PROGRESS",
      "HIGH",
      future2
    ),

    createTask(
      project3.id,
      developers[1].id,
      "Implement Checkout",
      "IN_REVIEW",
      "CRITICAL",
      future3
    ),

    createTask(
      project3.id,
      developers[3].id,
      "Add Order API",
      "DONE",
      "MEDIUM",
      future1
    ),

    createTask(
      project3.id,
      developers[0].id,
      "Implement Product Search",
      "TODO",
      "MEDIUM",
      future2
    ),
  ]);

  // --------------------------------------------------
  // ACTIVITY LOGS
  // --------------------------------------------------

  const allTasks = [
    ...project1Tasks,
    ...project2Tasks,
    ...project3Tasks,
  ];

  for (const task of allTasks) {
    await prisma.activityLog.create({
      data: {
        taskId: task.id,
        userId: task.developerId,
        fromStatus: null,
        toStatus: task.status,
      },
    });
  }

  // Additional status-change history
  await prisma.activityLog.create({
    data: {
      taskId: project1Tasks[0].id,
      userId: developers[0].id,
      fromStatus: "IN_PROGRESS",
      toStatus: "DONE",
    },
  });

  await prisma.activityLog.create({
    data: {
      taskId: project2Tasks[0].id,
      userId: developers[2].id,
      fromStatus: "TODO",
      toStatus: "IN_PROGRESS",
    },
  });

  await prisma.activityLog.create({
    data: {
      taskId: project3Tasks[1].id,
      userId: developers[3].id,
      fromStatus: "TODO",
      toStatus: "IN_PROGRESS",
    },
  });

  // --------------------------------------------------
  // SAMPLE NOTIFICATION
  // --------------------------------------------------

  await prisma.notification.create({
    data: {
      userId: developers[0].id,
      type: "TASK_STATUS_CHANGED",
      message: `Task "${project1Tasks[0].title}" is currently DONE.`,
    },
  });

  console.log("Seed completed successfully.");
  console.log("");
  console.log("Login credentials:");
  console.log("Admin: admin@velozity.com / password123");
  console.log("PM1:   pm1@velozity.com / password123");
  console.log("PM2:   pm2@velozity.com / password123");
  console.log("Dev1:  dev1@velozity.com / password123");
  console.log("Dev2:  dev2@velozity.com / password123");
  console.log("Dev3:  dev3@velozity.com / password123");
  console.log("Dev4:  dev4@velozity.com / password123");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });