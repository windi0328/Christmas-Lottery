using System.ComponentModel.DataAnnotations;

namespace ChristmasGiftExchange.Models;

public class Participant
{
    public int Id { get; set; }
    public int EventId { get; set; }

    [Required, StringLength(40)]
    public string Name { get; set; } = string.Empty;

    [EmailAddress, StringLength(120)]
    public string? Email { get; set; }

    [StringLength(160)]
    public string? WishlistHint { get; set; }

    [Required, StringLength(20)]
    public string AccessCode { get; set; } = Guid.NewGuid().ToString("N")[..8].ToUpperInvariant();

    public GiftExchangeEvent? Event { get; set; }
    public ICollection<DrawAssignment> GivenAssignments { get; set; } = new List<DrawAssignment>();
    public ICollection<DrawAssignment> ReceivedAssignments { get; set; } = new List<DrawAssignment>();
}
