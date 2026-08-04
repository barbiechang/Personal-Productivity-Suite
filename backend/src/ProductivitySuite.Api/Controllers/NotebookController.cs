using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using ProductivitySuite.Api.Data;
using ProductivitySuite.Api.Hubs;
using ProductivitySuite.Api.Models;

namespace ProductivitySuite.Api.Controllers;

[ApiController]
[Route("api/notebook/pages")]
public class NotebookController(AppDbContext db, IHubContext<NotificationHub> hub) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<NotebookPage>>> GetAll() =>
        Ok(await db.NotebookPages.OrderByDescending(p => p.UpdatedAt).ToListAsync());

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<NotebookPage>> GetOne(Guid id)
    {
        var page = await db.NotebookPages.FindAsync(id);
        return page is null ? NotFound() : Ok(page);
    }

    [HttpPost]
    public async Task<ActionResult<NotebookPage>> Create(NotebookPage input)
    {
        var page = new NotebookPage { Title = input.Title, PaperStyle = input.PaperStyle };
        db.NotebookPages.Add(page);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetOne), new { id = page.Id }, page);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<NotebookPage>> Update(Guid id, NotebookPage input)
    {
        var page = await db.NotebookPages.FindAsync(id);
        if (page is null) return NotFound();

        page.Title = input.Title;
        page.PaperStyle = input.PaperStyle;
        page.CanvasJson = input.CanvasJson;
        page.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        await hub.Clients.All.SendAsync("notebookPageChanged", page.Id);
        return Ok(page);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var page = await db.NotebookPages.FindAsync(id);
        if (page is null) return NotFound();

        db.NotebookPages.Remove(page);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
