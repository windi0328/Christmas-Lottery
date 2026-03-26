namespace ChristmasGiftExchange.Models;

public class DrawAssignment
{
    public int Id { get; set; }
    public int EventId { get; set; }
    public int GiverParticipantId { get; set; }
    public int ReceiverParticipantId { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public GiftExchangeEvent? Event { get; set; }
    public Participant? Giver { get; set; }
    public Participant? Receiver { get; set; }
}
