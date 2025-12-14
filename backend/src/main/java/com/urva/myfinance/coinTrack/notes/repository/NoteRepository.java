package com.urva.myfinance.coinTrack.notes.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.urva.myfinance.coinTrack.notes.model.Note;

@Repository
public interface NoteRepository extends MongoRepository<Note, String> {
    List<Note> findByUserId(String userId);

    List<Note> findByUserIdOrderByPinnedDescUpdatedAtDesc(String userId);
}
