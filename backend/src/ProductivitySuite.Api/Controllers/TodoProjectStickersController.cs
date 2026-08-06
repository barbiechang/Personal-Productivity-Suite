using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProductivitySuite.Api.Data;
using ProductivitySuite.Api.Models;

namespace ProductivitySuite.Api.Controllers;

public record CreateTodoProjectStickerRequest(Guid ProjectId, string ImageDataUrl, double X, double Y, double Width, double Height);
public record UpdateTodoProjectStickerRequest(double? X, double? Y, double? Width, double? Height, int? ZIndex);

[ApiController]
[Route("api/todo-project-stickers")]
public class TodoProjectStickersController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<TodoProjectSticker>>> GetAll([FromQuery] Guid projectId)
    {
        var stickers = await db.TodoProjectStickers.Where(s => s.ProjectId == projectId).OrderBy(s => s.ZIndex).ToListAsync();
        return Ok(stickers);
    }

    [HttpPost]
    public async Task<ActionResult<TodoProjectSticker>> Create(CreateTodoProjectStickerRequest input)
    {
        var maxZ = await db.TodoProjectStickers.Where(s => s.ProjectId == input.ProjectId).Select(s => (int?)s.ZIndex).MaxAsync() ?? 0;

        var sticker = new TodoProjectSticker
        {
            ProjectId = input.ProjectId,
            ImageDataUrl = input.ImageDataUrl,
            X = input.X,
            Y = input.Y,
            Width = input.Width,
            Height = input.Height,
            ZIndex = maxZ + 1,
        };
        db.TodoProjectStickers.Add(sticker);
        await db.SaveChangesAsync();
        return Ok(sticker);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<TodoProjectSticker>> Update(Guid id, UpdateTodoProjectStickerRequest input)
    {
        var sticker = await db.TodoProjectStickers.FindAsync(id);
        if (sticker is null) return NotFound();

        sticker.X = input.X ?? sticker.X;
        sticker.Y = input.Y ?? sticker.Y;
        sticker.Width = input.Width ?? sticker.Width;
        sticker.Height = input.Height ?? sticker.Height;
        sticker.ZIndex = input.ZIndex ?? sticker.ZIndex;
        await db.SaveChangesAsync();
        return Ok(sticker);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var sticker = await db.TodoProjectStickers.FindAsync(id);
        if (sticker is null) return NotFound();

        db.TodoProjectStickers.Remove(sticker);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
