using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProductivitySuite.Api.Data;
using ProductivitySuite.Api.Models;

namespace ProductivitySuite.Api.Controllers;

public record TodoProjectSummary(Guid Id, string Name, string? Description, string? CoverDataUrl, DateTime? StartDate, DateTime? EndDate, int TodoCount, int DoneCount, DateTime UpdatedAt);
public record UpsertTodoProjectRequest(string Name, string? Description, string? CoverDataUrl, DateTime? StartDate, DateTime? EndDate);

[ApiController]
[Route("api/todo-projects")]
public class TodoProjectsController(AppDbContext db) : ControllerBase
{
    private static DateTime? AsUtc(DateTime? dt) => dt.HasValue ? DateTime.SpecifyKind(dt.Value, DateTimeKind.Utc) : null;

    [HttpGet]
    public async Task<ActionResult<List<TodoProjectSummary>>> GetAll()
    {
        var projects = await db.TodoProjects
            .OrderByDescending(p => p.UpdatedAt)
            .Select(p => new TodoProjectSummary(
                p.Id, p.Name, p.Description, p.CoverDataUrl, p.StartDate, p.EndDate,
                db.Todos.Count(t => t.ProjectId == p.Id),
                db.Todos.Count(t => t.ProjectId == p.Id && t.IsDone),
                p.UpdatedAt))
            .ToListAsync();
        return Ok(projects);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<TodoProject>> GetOne(Guid id)
    {
        var project = await db.TodoProjects.FindAsync(id);
        return project is null ? NotFound() : Ok(project);
    }

    [HttpPost]
    public async Task<ActionResult<TodoProject>> Create(UpsertTodoProjectRequest input)
    {
        var project = new TodoProject
        {
            Name = string.IsNullOrWhiteSpace(input.Name) ? "Untitled" : input.Name,
            Description = input.Description,
            CoverDataUrl = input.CoverDataUrl,
            StartDate = AsUtc(input.StartDate),
            EndDate = AsUtc(input.EndDate),
        };
        db.TodoProjects.Add(project);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetOne), new { id = project.Id }, project);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<TodoProject>> Update(Guid id, UpsertTodoProjectRequest input)
    {
        var project = await db.TodoProjects.FindAsync(id);
        if (project is null) return NotFound();

        project.Name = string.IsNullOrWhiteSpace(input.Name) ? project.Name : input.Name;
        project.Description = input.Description ?? project.Description;
        project.CoverDataUrl = input.CoverDataUrl ?? project.CoverDataUrl;
        project.StartDate = AsUtc(input.StartDate) ?? project.StartDate;
        project.EndDate = AsUtc(input.EndDate) ?? project.EndDate;
        project.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return Ok(project);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var project = await db.TodoProjects.FindAsync(id);
        if (project is null) return NotFound();

        db.TodoProjects.Remove(project);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
