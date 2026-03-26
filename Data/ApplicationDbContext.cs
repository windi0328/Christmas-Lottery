using ChristmasGiftExchange.Models;
using Microsoft.EntityFrameworkCore;

namespace ChristmasGiftExchange.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<GiftExchangeEvent> Events => Set<GiftExchangeEvent>();
    public DbSet<Participant> Participants => Set<Participant>();
    public DbSet<DrawAssignment> DrawAssignments => Set<DrawAssignment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<GiftExchangeEvent>()
            .HasMany(e => e.Participants)
            .WithOne(p => p.Event)
            .HasForeignKey(p => p.EventId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<GiftExchangeEvent>()
            .HasMany(e => e.Assignments)
            .WithOne(a => a.Event)
            .HasForeignKey(a => a.EventId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<DrawAssignment>()
            .HasOne(a => a.Giver)
            .WithMany(p => p.GivenAssignments)
            .HasForeignKey(a => a.GiverParticipantId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<DrawAssignment>()
            .HasOne(a => a.Receiver)
            .WithMany(p => p.ReceivedAssignments)
            .HasForeignKey(a => a.ReceiverParticipantId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<DrawAssignment>()
            .HasIndex(a => new { a.EventId, a.GiverParticipantId })
            .IsUnique();

        modelBuilder.Entity<DrawAssignment>()
            .HasIndex(a => new { a.EventId, a.ReceiverParticipantId })
            .IsUnique();

        modelBuilder.Entity<Participant>()
            .HasIndex(p => new { p.EventId, p.AccessCode })
            .IsUnique();

        base.OnModelCreating(modelBuilder);
    }
}
