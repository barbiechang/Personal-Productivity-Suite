using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProductivitySuite.Api.Data;
using ProductivitySuite.Api.Models;

namespace ProductivitySuite.Api.Controllers;

public record TripSummary(Guid Id, string Name, string? Description, string? CoverDataUrl, DateTime? StartDate, DateTime? EndDate, int ItineraryCount, DateTime UpdatedAt);
public record UpsertTripRequest(string Name, string? Description, string? CoverDataUrl, DateTime? StartDate, DateTime? EndDate);

[ApiController]
[Route("api/trips")]
public class TripsController(AppDbContext db) : ControllerBase
{
    private static DateTime? AsUtc(DateTime? dt) => dt.HasValue ? DateTime.SpecifyKind(dt.Value, DateTimeKind.Utc) : null;

    [HttpGet]
    public async Task<ActionResult<List<TripSummary>>> GetAll()
    {
        var trips = await db.Trips
            .OrderByDescending(t => t.UpdatedAt)
            .Select(t => new TripSummary(
                t.Id, t.Name, t.Description, t.CoverDataUrl, t.StartDate, t.EndDate,
                db.TripItineraryItems.Count(i => i.TripId == t.Id), t.UpdatedAt))
            .ToListAsync();
        return Ok(trips);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<Trip>> GetOne(Guid id)
    {
        var trip = await db.Trips.FindAsync(id);
        return trip is null ? NotFound() : Ok(trip);
    }

    [HttpPost]
    public async Task<ActionResult<Trip>> Create(UpsertTripRequest input)
    {
        var trip = new Trip
        {
            Name = string.IsNullOrWhiteSpace(input.Name) ? "Untitled trip" : input.Name,
            Description = input.Description,
            CoverDataUrl = input.CoverDataUrl,
            StartDate = AsUtc(input.StartDate),
            EndDate = AsUtc(input.EndDate),
        };
        db.Trips.Add(trip);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetOne), new { id = trip.Id }, trip);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<Trip>> Update(Guid id, UpsertTripRequest input)
    {
        var trip = await db.Trips.FindAsync(id);
        if (trip is null) return NotFound();

        trip.Name = string.IsNullOrWhiteSpace(input.Name) ? trip.Name : input.Name;
        trip.Description = input.Description ?? trip.Description;
        trip.CoverDataUrl = input.CoverDataUrl ?? trip.CoverDataUrl;
        trip.StartDate = AsUtc(input.StartDate) ?? trip.StartDate;
        trip.EndDate = AsUtc(input.EndDate) ?? trip.EndDate;
        trip.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return Ok(trip);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var trip = await db.Trips.FindAsync(id);
        if (trip is null) return NotFound();

        db.Trips.Remove(trip);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
