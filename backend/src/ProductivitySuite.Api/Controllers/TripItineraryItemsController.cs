using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProductivitySuite.Api.Data;
using ProductivitySuite.Api.Models;

namespace ProductivitySuite.Api.Controllers;

public record CreateTripItineraryItemRequest(Guid TripId, int DayNumber, string? Time, string Title, string? Notes);
public record UpdateTripItineraryItemRequest(int? DayNumber, string? Time, string? Title, string? Notes, int? Order);

[ApiController]
[Route("api/trip-itinerary-items")]
public class TripItineraryItemsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<TripItineraryItem>>> GetAll([FromQuery] Guid tripId)
    {
        var items = await db.TripItineraryItems
            .Where(i => i.TripId == tripId)
            .OrderBy(i => i.DayNumber).ThenBy(i => i.Order)
            .ToListAsync();
        return Ok(items);
    }

    [HttpPost]
    public async Task<ActionResult<TripItineraryItem>> Create(CreateTripItineraryItemRequest input)
    {
        var maxOrder = await db.TripItineraryItems
            .Where(i => i.TripId == input.TripId && i.DayNumber == input.DayNumber)
            .Select(i => (int?)i.Order)
            .MaxAsync() ?? -1;

        var item = new TripItineraryItem
        {
            TripId = input.TripId,
            DayNumber = input.DayNumber,
            Time = input.Time,
            Title = input.Title,
            Notes = input.Notes,
            Order = maxOrder + 1,
        };
        db.TripItineraryItems.Add(item);
        await db.SaveChangesAsync();
        return Ok(item);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<TripItineraryItem>> Update(Guid id, UpdateTripItineraryItemRequest input)
    {
        var item = await db.TripItineraryItems.FindAsync(id);
        if (item is null) return NotFound();

        item.DayNumber = input.DayNumber ?? item.DayNumber;
        item.Time = input.Time ?? item.Time;
        item.Title = input.Title ?? item.Title;
        item.Notes = input.Notes ?? item.Notes;
        item.Order = input.Order ?? item.Order;
        await db.SaveChangesAsync();
        return Ok(item);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var item = await db.TripItineraryItems.FindAsync(id);
        if (item is null) return NotFound();

        db.TripItineraryItems.Remove(item);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
