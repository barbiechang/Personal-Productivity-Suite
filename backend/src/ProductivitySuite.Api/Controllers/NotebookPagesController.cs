using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using ProductivitySuite.Api.Data;
using ProductivitySuite.Api.Hubs;
using ProductivitySuite.Api.Models;

namespace ProductivitySuite.Api.Controllers;

public record CreatePageRequest(int Order, PaperStyle PaperStyle, PageSize PageSize, string BackgroundColor, string CanvasJson, string? ThumbnailDataUrl = null);
public record UpdatePageRequest(int Order, PaperStyle PaperStyle, PageSize PageSize, string BackgroundColor, string CanvasJson, string? ThumbnailDataUrl);

[ApiController]
[Route("api/notebooks/{notebookId:guid}/pages")]
public class NotebookPagesController(AppDbContext db, IHubContext<NotificationHub> hub) : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<NotebookPage>> Create(Guid notebookId, CreatePageRequest input)
    {
        var notebook = await db.Notebooks.FindAsync(notebookId);
        if (notebook is null) return NotFound();

        var page = new NotebookPage
        {
            NotebookId = notebookId,
            Order = input.Order,
            PaperStyle = input.PaperStyle,
            PageSize = input.PageSize,
            BackgroundColor = string.IsNullOrWhiteSpace(input.BackgroundColor) ? "#ffffff" : input.BackgroundColor,
            CanvasJson = input.CanvasJson,
            ThumbnailDataUrl = input.ThumbnailDataUrl,
        };
        db.NotebookPages.Add(page);
        notebook.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(Create), new { notebookId, id = page.Id }, page);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<NotebookPage>> Update(Guid notebookId, Guid id, UpdatePageRequest input)
    {
        var page = await db.NotebookPages.FirstOrDefaultAsync(p => p.Id == id && p.NotebookId == notebookId);
        if (page is null) return NotFound();

        page.Order = input.Order;
        page.PaperStyle = input.PaperStyle;
        page.PageSize = input.PageSize;
        page.BackgroundColor = string.IsNullOrWhiteSpace(input.BackgroundColor) ? page.BackgroundColor : input.BackgroundColor;
        page.CanvasJson = input.CanvasJson;
        page.ThumbnailDataUrl = input.ThumbnailDataUrl ?? page.ThumbnailDataUrl;
        page.UpdatedAt = DateTime.UtcNow;

        var notebook = await db.Notebooks.FindAsync(notebookId);
        if (notebook is not null)
        {
            notebook.UpdatedAt = DateTime.UtcNow;
            if (page.Order == 0 && page.ThumbnailDataUrl is not null && !notebook.CoverIsCustom)
            {
                notebook.CoverDataUrl = page.ThumbnailDataUrl;
            }
        }

        await db.SaveChangesAsync();
        await hub.Clients.All.SendAsync("notebookPageChanged", notebookId, page.Id);
        return Ok(page);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid notebookId, Guid id)
    {
        var page = await db.NotebookPages.FirstOrDefaultAsync(p => p.Id == id && p.NotebookId == notebookId);
        if (page is null) return NotFound();

        db.NotebookPages.Remove(page);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
