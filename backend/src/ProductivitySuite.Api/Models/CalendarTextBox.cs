namespace ProductivitySuite.Api.Models;

public class CalendarTextBox
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public int Year { get; set; }
    public int Month { get; set; }
    public string Text { get; set; } = string.Empty;
    public double X { get; set; }
    public double Y { get; set; }
    public int FontSize { get; set; } = 13;
    public string Color { get; set; } = "#7c5f6e";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
