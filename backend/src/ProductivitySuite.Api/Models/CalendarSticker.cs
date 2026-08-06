namespace ProductivitySuite.Api.Models;

public enum CalendarStickerRegion
{
    Grid,
    Sidebar,
}

public class CalendarSticker
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public int Year { get; set; }
    public int Month { get; set; }
    public CalendarStickerRegion Region { get; set; }
    public string ImageDataUrl { get; set; } = string.Empty;
    public double X { get; set; }
    public double Y { get; set; }
    public double Width { get; set; }
    public double Height { get; set; }
    public int ZIndex { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
