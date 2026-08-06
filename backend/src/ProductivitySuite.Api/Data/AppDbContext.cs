using Microsoft.EntityFrameworkCore;
using ProductivitySuite.Api.Models;

namespace ProductivitySuite.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<TodoItem> Todos => Set<TodoItem>();
    public DbSet<TodoProject> TodoProjects => Set<TodoProject>();
    public DbSet<Note> Notes => Set<Note>();
    public DbSet<Folder> Folders => Set<Folder>();
    public DbSet<Notebook> Notebooks => Set<Notebook>();
    public DbSet<NotebookPage> NotebookPages => Set<NotebookPage>();
    public DbSet<CalendarEvent> CalendarEvents => Set<CalendarEvent>();
    public DbSet<CalendarListItem> CalendarListItems => Set<CalendarListItem>();
    public DbSet<CalendarSticker> CalendarStickers => Set<CalendarSticker>();
    public DbSet<CalendarTextBox> CalendarTextBoxes => Set<CalendarTextBox>();
    public DbSet<Expense> Expenses => Set<Expense>();
    public DbSet<FileItem> Files => Set<FileItem>();
    public DbSet<DashboardSettings> DashboardSettings => Set<DashboardSettings>();
    public DbSet<DashboardImage> DashboardImages => Set<DashboardImage>();
    public DbSet<FamilyMember> FamilyMembers => Set<FamilyMember>();
    public DbSet<VocabWord> VocabWords => Set<VocabWord>();
    public DbSet<Trip> Trips => Set<Trip>();
    public DbSet<TripItineraryItem> TripItineraryItems => Set<TripItineraryItem>();
    public DbSet<TripPackingItem> TripPackingItems => Set<TripPackingItem>();
    public DbSet<TodoProjectSticker> TodoProjectStickers => Set<TodoProjectSticker>();
    public DbSet<TodoProjectResource> TodoProjectResources => Set<TodoProjectResource>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Expense>().Property(e => e.Amount).HasPrecision(12, 2);

        modelBuilder.Entity<NotebookPage>()
            .HasOne(p => p.Notebook)
            .WithMany(n => n.Pages)
            .HasForeignKey(p => p.NotebookId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Notebook>()
            .HasOne<Folder>()
            .WithMany()
            .HasForeignKey(n => n.FolderId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<TodoItem>()
            .HasOne<TodoProject>()
            .WithMany()
            .HasForeignKey(t => t.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<TripItineraryItem>()
            .HasOne<Trip>()
            .WithMany()
            .HasForeignKey(i => i.TripId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<TripPackingItem>()
            .HasOne<Trip>()
            .WithMany()
            .HasForeignKey(i => i.TripId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<TodoProjectSticker>()
            .HasOne<TodoProject>()
            .WithMany()
            .HasForeignKey(s => s.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<TodoProjectResource>()
            .HasOne<TodoProject>()
            .WithMany()
            .HasForeignKey(r => r.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
