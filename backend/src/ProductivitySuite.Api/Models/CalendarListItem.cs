namespace ProductivitySuite.Api.Models;

public enum CalendarListKind
{
    Priority,
    Wishlist,
    Note,
}

public class CalendarListItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public int Year { get; set; }
    public int Month { get; set; }
    public CalendarListKind Kind { get; set; }
    public string Text { get; set; } = string.Empty;
    public bool IsDone { get; set; }
    public int Order { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
