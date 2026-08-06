namespace ProductivitySuite.Api.Models;

public class TripPackingItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TripId { get; set; }
    public string Text { get; set; } = string.Empty;
    public bool IsPacked { get; set; }
    public int Order { get; set; }
}
