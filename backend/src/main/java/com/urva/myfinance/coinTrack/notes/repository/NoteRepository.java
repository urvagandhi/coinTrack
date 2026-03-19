package com.urva.myfinance.coinTrack.notes.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import com.urva.myfinance.coinTrack.notes.model.Note;

@Repository
public interface NoteRepository extends MongoRepository<Note, String> {

    List<Note> findByUserId(String userId);

    List<Note> findByUserIdOrderByPinnedDescUpdatedAtDesc(String userId);

    Page<Note> findByUserId(String userId, Pageable pageable);

    /**
     * Search notes by title or content (case-insensitive partial match).
     */
    @Query("{'userId': ?0, '$or': [{'title': {$regex: ?1, $options: 'i'}}, {'content': {$regex: ?1, $options: 'i'}}]}")
    Page<Note> searchByUserIdAndText(String userId, String searchTerm, Pageable pageable);

    /**
     * Filter notes by tag (exact match within tags array).
     */
    Page<Note> findByUserIdAndTagsContaining(String userId, String tag, Pageable pageable);
}
