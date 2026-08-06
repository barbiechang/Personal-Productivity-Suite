namespace ProductivitySuite.Api.Models;

public class TripItineraryItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TripId { get; set; }
    public int DayNumber { get; set; } = 1;
    public string? Time { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public int Order { get; set; }
}
