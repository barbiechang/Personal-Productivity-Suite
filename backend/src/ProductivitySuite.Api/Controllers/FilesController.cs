using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProductivitySuite.Api.Data;
using ProductivitySuite.Api.Models;

namespace ProductivitySuite.Api.Controllers;

[ApiController]
[Route("api/files")]
public class FilesController(AppDbContext db, IWebHostEnvironment env) : ControllerBase
{
    private string UploadsRoot => Path.Combine(env.ContentRootPath, "Uploads");

    [HttpGet]
    public async Task<ActionResult<List<FileItem>>> GetAll() =>
        Ok(await db.Files.OrderByDescending(f => f.UploadedAt).ToListAsync());

    [HttpPost("upload")]
    [RequestSizeLimit(50_000_000)]
    public async Task<ActionResult<FileItem>> Upload(IFormFile file)
    {
        if (file.Length == 0) return BadRequest("Empty file.");

        Directory.CreateDirectory(UploadsRoot);
        var storedName = $"{Guid.NewGuid()}_{file.FileName}";
        var fullPath = Path.Combine(UploadsRoot, storedName);

        await using (var stream = System.IO.File.Create(fullPath))
        {
            await file.CopyToAsync(stream);
        }

        var entry = new FileItem
        {
            Name = file.FileName,
            StoragePath = storedName,
            SizeBytes = file.Length,
            ContentType = file.ContentType,
        };
        db.Files.Add(entry);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetAll), new { id = entry.Id }, entry);
    }

    [HttpGet("{id:guid}/download")]
    public async Task<IActionResult> Download(Guid id)
    {
        var entry = await db.Files.FindAsync(id);
        if (entry is null) return NotFound();

        var fullPath = Path.Combine(UploadsRoot, entry.StoragePath);
        if (!System.IO.File.Exists(fullPath)) return NotFound();

        return PhysicalFile(fullPath, entry.ContentType, entry.Name);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var entry = await db.Files.FindAsync(id);
        if (entry is null) return NotFound();

        var fullPath = Path.Combine(UploadsRoot, entry.StoragePath);
        if (System.IO.File.Exists(fullPath)) System.IO.File.Delete(fullPath);

        db.Files.Remove(entry);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
