namespace ProductivitySuite.Api.Models;

public class DashboardSettings
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string? PetGifDataUrl { get; set; }
    public string? FamilyCoverDataUrl { get; set; }
    public string? TodoBannerDataUrl { get; set; }
    public string? TodoBannerIconDataUrl { get; set; }
    public string? CalendarBannerDataUrl { get; set; }
    public string? CalendarBannerIconDataUrl { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
