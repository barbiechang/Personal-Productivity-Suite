using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProductivitySuite.Api.Data;
using ProductivitySuite.Api.Models;

namespace ProductivitySuite.Api.Controllers;

public record CreateTodoProjectResourceRequest(Guid ProjectId, string Label, string? Url, string? FileDataUrl, string? FileName);

[ApiController]
[Route("api/todo-project-resources")]
public class TodoProjectResourcesController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<TodoProjectResource>>> GetAll([FromQuery] Guid projectId)
    {
        var resources = await db.TodoProjectResources.Where(r => r.ProjectId == projectId).OrderBy(r => r.CreatedAt).ToListAsync();
        return Ok(resources);
    }

    [HttpPost]
    public async Task<ActionResult<TodoProjectResource>> Create(CreateTodoProjectResourceRequest input)
    {
        var resource = new TodoProjectResource
        {
            ProjectId = input.ProjectId,
            Label = string.IsNullOrWhiteSpace(input.Label) ? (input.FileName ?? "Untitled") : input.Label,
            Url = input.Url,
            FileDataUrl = input.FileDataUrl,
            FileName = input.FileName,
        };
        db.TodoProjectResources.Add(resource);
        await db.SaveChangesAsync();
        return Ok(resource);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var resource = await db.TodoProjectResources.FindAsync(id);
        if (resource is null) return NotFound();

        db.TodoProjectResources.Remove(resource);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
