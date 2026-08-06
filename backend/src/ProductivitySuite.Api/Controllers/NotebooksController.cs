using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProductivitySuite.Api.Data;
using ProductivitySuite.Api.Models;

namespace ProductivitySuite.Api.Controllers;

public record NotebookSummary(Guid Id, string Title, string? CoverDataUrl, Guid? FolderId, int PageCount, DateTime UpdatedAt);
public record CreateNotebookRequest(string Title, Guid? FolderId);
public record UpdateNotebookRequest(string Title, string? CoverDataUrl, Guid? FolderId);

[ApiController]
[Route("api/notebooks")]
public class NotebooksController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<NotebookSummary>>> GetAll([FromQuery] Guid? folderId)
    {
        var notebooks = await db.Notebooks
            .Where(n => n.FolderId == folderId)
            .OrderByDescending(n => n.UpdatedAt)
            .Select(n => new NotebookSummary(n.Id, n.Title, n.CoverDataUrl, n.FolderId, n.Pages.Count, n.UpdatedAt))
            .ToListAsync();
        return Ok(notebooks);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<Notebook>> GetOne(Guid id)
    {
        var notebook = await db.Notebooks
            .Include(n => n.Pages.OrderBy(p => p.Order))
            .FirstOrDefaultAsync(n => n.Id == id);
        return notebook is null ? NotFound() : Ok(notebook);
    }

    [HttpPost]
    public async Task<ActionResult<Notebook>> Create(CreateNotebookRequest input)
    {
        var notebook = new Notebook
        {
            Title = string.IsNullOrWhiteSpace(input.Title) ? "Untitled" : input.Title,
            FolderId = input.FolderId,
        };
        notebook.Pages.Add(new NotebookPage { NotebookId = notebook.Id, Order = 0 });

        db.Notebooks.Add(notebook);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetOne), new { id = notebook.Id }, notebook);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<Notebook>> Update(Guid id, UpdateNotebookRequest input)
    {
        var notebook = await db.Notebooks.FindAsync(id);
        if (notebook is null) return NotFound();

        notebook.Title = string.IsNullOrWhiteSpace(input.Title) ? notebook.Title : input.Title;
        if (input.CoverDataUrl is not null)
        {
            notebook.CoverDataUrl = input.CoverDataUrl;
            notebook.CoverIsCustom = true;
        }
        notebook.FolderId = input.FolderId;
        notebook.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return Ok(notebook);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var notebook = await db.Notebooks.FindAsync(id);
        if (notebook is null) return NotFound();

        db.Notebooks.Remove(notebook);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
