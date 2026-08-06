using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProductivitySuite.Api.Data;
using ProductivitySuite.Api.Models;

namespace ProductivitySuite.Api.Controllers;

public record CreateTripPackingItemRequest(Guid TripId, string Text);
public record UpdateTripPackingItemRequest(string? Text, bool? IsPacked);

[ApiController]
[Route("api/trip-packing-items")]
public class TripPackingItemsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<TripPackingItem>>> GetAll([FromQuery] Guid tripId)
    {
        var items = await db.TripPackingItems.Where(i => i.TripId == tripId).OrderBy(i => i.Order).ToListAsync();
        return Ok(items);
    }

    [HttpPost]
    public async Task<ActionResult<TripPackingItem>> Create(CreateTripPackingItemRequest input)
    {
        var maxOrder = await db.TripPackingItems
            .Where(i => i.TripId == input.TripId)
            .Select(i => (int?)i.Order)
            .MaxAsync() ?? -1;

        var item = new TripPackingItem { TripId = input.TripId, Text = input.Text, Order = maxOrder + 1 };
        db.TripPackingItems.Add(item);
        await db.SaveChangesAsync();
        return Ok(item);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<TripPackingItem>> Update(Guid id, UpdateTripPackingItemRequest input)
    {
        var item = await db.TripPackingItems.FindAsync(id);
        if (item is null) return NotFound();

        item.Text = input.Text ?? item.Text;
        item.IsPacked = input.IsPacked ?? item.IsPacked;
        await db.SaveChangesAsync();
        return Ok(item);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var item = await db.TripPackingItems.FindAsync(id);
        if (item is null) return NotFound();

        db.TripPackingItems.Remove(item);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
