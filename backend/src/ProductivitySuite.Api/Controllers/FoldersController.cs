using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProductivitySuite.Api.Data;
using ProductivitySuite.Api.Models;

namespace ProductivitySuite.Api.Controllers;

public record FolderSummary(Guid Id, string Name, string? CoverDataUrl, int NotebookCount, DateTime UpdatedAt);
public record UpsertFolderRequest(string Name, string? CoverDataUrl = null);

[ApiController]
[Route("api/folders")]
public class FoldersController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<FolderSummary>>> GetAll()
    {
        var folders = await db.Folders
            .OrderBy(f => f.Name)
            .Select(f => new FolderSummary(f.Id, f.Name, f.CoverDataUrl, db.Notebooks.Count(n => n.FolderId == f.Id), f.UpdatedAt))
            .ToListAsync();
        return Ok(folders);
    }

    [HttpPost]
    public async Task<ActionResult<Folder>> Create(UpsertFolderRequest input)
    {
        var folder = new Folder { Name = string.IsNullOrWhiteSpace(input.Name) ? "Untitled Folder" : input.Name };
        db.Folders.Add(folder);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetAll), new { id = folder.Id }, folder);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<Folder>> Rename(Guid id, UpsertFolderRequest input)
    {
        var folder = await db.Folders.FindAsync(id);
        if (folder is null) return NotFound();

        folder.Name = string.IsNullOrWhiteSpace(input.Name) ? folder.Name : input.Name;
        if (input.CoverDataUrl is not null) folder.CoverDataUrl = input.CoverDataUrl;
        folder.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return Ok(folder);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var folder = await db.Folders.FindAsync(id);
        if (folder is null) return NotFound();

        db.Folders.Remove(folder);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
