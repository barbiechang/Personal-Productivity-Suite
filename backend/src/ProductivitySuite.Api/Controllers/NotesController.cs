using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProductivitySuite.Api.Data;
using ProductivitySuite.Api.Models;

namespace ProductivitySuite.Api.Controllers;

[ApiController]
[Route("api/notes")]
public class NotesController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<Note>>> GetAll() =>
        Ok(await db.Notes.OrderByDescending(n => n.UpdatedAt).ToListAsync());

    [HttpPost]
    public async Task<ActionResult<Note>> Create(Note input)
    {
        var note = new Note { Title = input.Title, Body = input.Body };
        db.Notes.Add(note);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetAll), new { id = note.Id }, note);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<Note>> Update(Guid id, Note input)
    {
        var note = await db.Notes.FindAsync(id);
        if (note is null) return NotFound();

        note.Title = input.Title;
        note.Body = input.Body;
        note.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return Ok(note);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var note = await db.Notes.FindAsync(id);
        if (note is null) return NotFound();

        db.Notes.Remove(note);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
