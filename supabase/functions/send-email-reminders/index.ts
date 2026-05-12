import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

serve(async (req: Request) => {
  // Allow only POST requests (typically from cron or authenticated invokers)
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured.");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all tasks that are not 'Done' and have due dates & reminders set
    const { data: tasks, error: tasksError } = await supabase
      .from("tasks")
      .select("*")
      .neq("status", "Done")
      .not("reminder_days", "is", null)
      .not("due_date", "is", null);

    if (tasksError) throw tasksError;

    // Filter tasks that need reminding today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tasksToRemind = tasks.filter((task) => {
      const dueDate = new Date(task.due_date);
      const reminderDate = new Date(dueDate);
      reminderDate.setDate(reminderDate.getDate() - task.reminder_days);
      reminderDate.setHours(0, 0, 0, 0);
      
      // Send reminder if today is the reminder day or if it's past the reminder day
      return reminderDate.getTime() <= today.getTime();
    });

    if (tasksToRemind.length === 0) {
      return new Response(JSON.stringify({ message: "No active reminders for today." }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Group tasks by user_id
    const tasksByUser: Record<string, typeof tasksToRemind> = {};
    for (const task of tasksToRemind) {
      if (!tasksByUser[task.user_id]) {
        tasksByUser[task.user_id] = [];
      }
      tasksByUser[task.user_id].push(task);
    }

    let sentCount = 0;

    // Fetch emails and send reminders
    for (const [userId, userTasks] of Object.entries(tasksByUser)) {
      // Use the admin API to get the user's email safely
      const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId);
      
      if (userError || !user?.email) {
        console.error(`Could not find email for user ${userId}`, userError);
        continue;
      }

      const taskListHtml = userTasks
        .map((t) => `<li><strong>${t.title}</strong> - Due: ${new Date(t.due_date).toLocaleDateString()}</li>`)
        .join("");

      const emailHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Your Daily Task Reminders</h2>
          <p>Hi there,</p>
          <p>You have <strong>${userTasks.length}</strong> active reminder(s) for today:</p>
          <ul style="background: #f9f9f9; padding: 20px; border-radius: 8px;">
            ${taskListHtml}
          </ul>
          <br/>
          <p>Log in to TaskFlow to view and manage your tasks.</p>
        </div>
      `;

      // Dispatch the email via Resend
      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "TaskFlow <onboarding@resend.dev>",
          to: user.email,
          subject: "Your Daily TaskFlow Reminders",
          html: emailHtml,
        }),
      });

      if (!resendRes.ok) {
        const errText = await resendRes.text();
        console.error(`Failed to send email to ${user.email}:`, errText);
      } else {
        sentCount++;
      }
    }

    return new Response(JSON.stringify({ message: `Successfully sent ${sentCount} reminders.` }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error processing reminders:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
