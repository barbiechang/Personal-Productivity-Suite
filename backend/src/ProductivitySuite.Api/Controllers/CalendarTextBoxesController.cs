using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProductivitySuite.Api.Data;
using ProductivitySuite.Api.Models;

namespace ProductivitySuite.Api.Controllers;

public record CreateCalendarTextBoxRequest(int Year, int Month, string Text, double X, double Y);
public record UpdateCalendarTextBoxRequest(string? Text, double? X, double? Y, int? FontSize, string? Color);

[ApiController]
[Route("api/calendar-text-boxes")]
public class CalendarTextBoxesController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<CalendarTextBox>>> GetAll([FromQuery] int year, [FromQuery] int month)
    {
        var boxes = await db.CalendarTextBoxes.Where(b => b.Year == year && b.Month == month).ToListAsync();
        return Ok(boxes);
    }

    [HttpPost]
    public async Task<ActionResult<CalendarTextBox>> Create(CreateCalendarTextBoxRequest input)
    {
        var box = new CalendarTextBox
        {
            Year = input.Year,
            Month = input.Month,
            Text = input.Text,
            X = input.X,
            Y = input.Y,
        };
        db.CalendarTextBoxes.Add(box);
        await db.SaveChangesAsync();
        return Ok(box);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<CalendarTextBox>> Update(Guid id, UpdateCalendarTextBoxRequest input)
    {
        var box = await db.CalendarTextBoxes.FindAsync(id);
        if (box is null) return NotFound();

        box.Text = input.Text ?? box.Text;
        box.X = input.X ?? box.X;
        box.Y = input.Y ?? box.Y;
        box.FontSize = input.FontSize ?? box.FontSize;
        box.Color = input.Color ?? box.Color;
        await db.SaveChangesAsync();
        return Ok(box);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var box = await db.CalendarTextBoxes.FindAsync(id);
        if (box is null) return NotFound();

        db.CalendarTextBoxes.Remove(box);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
