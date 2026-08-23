package com.urva.myfinance.coinTrack.notes.listener;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import com.urva.myfinance.coinTrack.common.event.UserDeletedEvent;
import com.urva.myfinance.coinTrack.notes.repository.NoteRepository;

/**
 * Cleans up notes owned by a deleted user. Listens on the common UserDeletedEvent
 * so the user module does not need to depend on this module.
 */
@Component
public class NotesUserDataCleanupListener {

    private static final Logger logger = LoggerFactory.getLogger(NotesUserDataCleanupListener.class);

    private final NoteRepository noteRepository;

    public NotesUserDataCleanupListener(NoteRepository noteRepository) {
        this.noteRepository = noteRepository;
    }

    @EventListener
    public void onUserDeleted(UserDeletedEvent event) {
        try {
            noteRepository.deleteByUserId(event.userId());
            logger.info("Cascade cleanup: deleted notes for user {}", event.userId());
        } catch (Exception e) {
            logger.error("Cascade cleanup failed for notes, user {}: {}", event.userId(), e.getMessage());
        }
    }
}
