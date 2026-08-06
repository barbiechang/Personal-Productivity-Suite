using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using ProductivitySuite.Api.Data;
using ProductivitySuite.Api.Hubs;
using ProductivitySuite.Api.Models;

namespace ProductivitySuite.Api.Controllers;

[ApiController]
[Route("api/todos")]
public class TodosController(AppDbContext db, IHubContext<NotificationHub> hub) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<TodoItem>>> GetAll([FromQuery] Guid projectId)
    {
        var todos = await db.Todos.Where(t => t.ProjectId == projectId).OrderBy(t => t.CreatedAt).ToListAsync();
        return Ok(todos);
    }

    [HttpPost]
    public async Task<ActionResult<TodoItem>> Create(TodoItem input)
    {
        var todo = new TodoItem
        {
            ProjectId = input.ProjectId,
            Title = input.Title,
            Section = string.IsNullOrWhiteSpace(input.Section) ? "General" : input.Section,
            DueDate = input.DueDate,
            Priority = input.Priority,
        };
        db.Todos.Add(todo);
        await db.SaveChangesAsync();
        await hub.Clients.All.SendAsync("todoChanged", todo.Id);
        return CreatedAtAction(nameof(GetAll), new { id = todo.Id }, todo);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<TodoItem>> Update(Guid id, TodoItem input)
    {
        var todo = await db.Todos.FindAsync(id);
        if (todo is null) return NotFound();

        todo.Title = input.Title;
        todo.Section = string.IsNullOrWhiteSpace(input.Section) ? todo.Section : input.Section;
        todo.IsDone = input.IsDone;
        todo.DueDate = input.DueDate;
        todo.Priority = input.Priority;
        await db.SaveChangesAsync();
        await hub.Clients.All.SendAsync("todoChanged", todo.Id);
        return Ok(todo);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var todo = await db.Todos.FindAsync(id);
        if (todo is null) return NotFound();

        db.Todos.Remove(todo);
        await db.SaveChangesAsync();
        await hub.Clients.All.SendAsync("todoChanged", id);
        return NoContent();
    }
}
